import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useCycleStore } from '../store/useCycleStore';
import { formatLocalDate } from '../utils/predictions';
import { CustomCalendar } from '../components/CustomCalendar';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { requestNotificationPermissions, scheduleDailyLogReminder, scheduleBirthControlReminder } from '../services/notifications';

type GoalType = 'TRACK' | 'AVOID' | 'CONCEIVE' | 'MENOPAUSE';
type BirthControlType = 'PILL' | 'IUD' | 'PATCH' | 'RING' | 'INJECTION' | 'NONE' | 'OTHER';

export const OnboardingScreen = ({ navigation }: any) => {
  const { colors, brandColors } = useTheme();
  const createOrUpdateProfile = useCycleStore(state => state.createOrUpdateProfile);
  const addPeriodRecord = useCycleStore(state => state.addPeriodRecord);
  const setPinCode = useCycleStore(state => state.setPinCode);

  const [step, setStep] = useState(1);

  // Form States
  const [goal, setGoal] = useState<GoalType>('TRACK');
  const [lastPeriodStart, setLastPeriodStart] = useState(formatLocalDate(new Date()));
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [birthControl, setBirthControl] = useState<BirthControlType>('NONE');
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [pinLock, setPinLock] = useState('');
  const [wantsPin, setWantsPin] = useState(false);

  const handleNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < 5) {
      setStep(prev => prev + 1);
    } else {
      await handleFinish();
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const handleFinish = async () => {
    // 1. Setup Notifications if enabled
    if (enableNotifications) {
      const granted = await requestNotificationPermissions();
      if (granted) {
        await scheduleDailyLogReminder(20, 0); // default 8pm
        if (birthControl === 'PILL') {
          await scheduleBirthControlReminder('21:00'); // default 9pm
        }
      }
    }

    // 2. Setup PIN Code
    if (wantsPin && pinLock.length === 4) {
      await setPinCode(pinLock);
    } else {
      await setPinCode(null);
    }

    // 3. Save Profile Settings
    createOrUpdateProfile({
      goal,
      average_cycle_length: cycleLength,
      average_period_length: periodLength,
      birth_control_type: birthControl,
      fertility_mode: goal === 'CONCEIVE' ? 1 : 0,
    });

    // 4. Log the first period start date as historical entry
    addPeriodRecord(lastPeriodStart);

    // Confetti Haptics
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Route to main dashboard
    navigation.replace('AppNavigator');
  };

  const selectGoal = (selected: GoalType) => {
    Haptics.selectionAsync();
    setGoal(selected);
  };

  const selectBirthControl = (selected: BirthControlType) => {
    Haptics.selectionAsync();
    setBirthControl(selected);
  };

  // Render Sub-steps
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <Animated.View key="step1" entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>What is your primary goal?</Text>
            <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
              This helps us customize predictions, logs, and notification reminders.
            </Text>

            <View style={styles.optionsList}>
              {[
                { id: 'TRACK', label: 'Track Periods', desc: 'Monitor cycle phases, moods, and symptoms.', icon: 'calendar-outline' },
                { id: 'AVOID', label: 'Avoid Pregnancy', desc: 'Identify fertile window and safety zones naturally.', icon: 'shield-outline' },
                { id: 'CONCEIVE', label: 'Trying to Conceive', desc: 'Track ovulation, BBT curve, and fertile window peaks.', icon: 'heart-outline' },
                { id: 'MENOPAUSE', label: 'Track Menopause', desc: 'Monitor cycle irregularity, symptoms, and transitions.', icon: 'water-outline' },
              ].map(item => {
                const isSelected = goal === item.id;
                return (
                  <Card
                    key={item.id}
                    onPress={() => selectGoal(item.id as GoalType)}
                    style={[
                      styles.selectableCard,
                      isSelected && { borderColor: brandColors.primary, borderWidth: 2 },
                    ]}
                  >
                    <View style={styles.optionRow}>
                      <Ionicons
                        name={item.icon as any}
                        size={24}
                        color={isSelected ? brandColors.primaryDark : colors.textSecondary}
                        style={styles.optionIcon}
                      />
                      <View style={styles.optionTextWrapper}>
                        <Text style={[styles.optionLabel, { color: colors.text }]}>{item.label}</Text>
                        <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
                      </View>
                    </View>
                  </Card>
                );
              })}
            </View>
          </Animated.View>
        );

      case 2:
        return (
          <Animated.View key="step2" entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>When did your last period start?</Text>
            <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
              We use this date as Day 1 to initialize your calendar and compute predictions.
            </Text>
            <View style={styles.calendarWrapper}>
              <CustomCalendar
                cycles={[]}
                predictions={null}
                selectedDate={lastPeriodStart}
                onDayPress={(date) => setLastPeriodStart(date)}
              />
            </View>
          </Animated.View>
        );

      case 3:
        return (
          <Animated.View key="step3" entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Cycle & Period defaults</Text>
            <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
              Enter your best estimate. These values auto-recalculate as you log real cycles.
            </Text>

            <View style={styles.slidersWrapper}>
              {/* Cycle Length Picker */}
              <Card style={styles.sliderCard}>
                <View style={styles.sliderHeader}>
                  <Text style={[styles.sliderLabel, { color: colors.text }]}>Average Cycle Length</Text>
                  <Text style={[styles.sliderValue, { color: brandColors.primaryDark }]}>{cycleLength} Days</Text>
                </View>
                <View style={styles.customStepper}>
                  <Button
                    title="-"
                    onPress={() => setCycleLength(prev => Math.max(21, prev - 1))}
                    variant="secondary"
                    style={styles.stepBtn}
                    textStyle={{ fontSize: 32, lineHeight: 36, marginTop: -4 }}
                  />
                  <Text style={[styles.stepperValText, { color: colors.text }]}>{cycleLength}</Text>
                  <Button
                    title="+"
                    onPress={() => setCycleLength(prev => Math.min(45, prev + 1))}
                    variant="secondary"
                    style={styles.stepBtn}
                    textStyle={{ fontSize: 28, lineHeight: 32, marginTop: -2 }}
                  />
                </View>
                <Text style={[styles.helperLabel, { color: colors.textSecondary }]}>
                  Interval from day 1 of a period to day 1 of the next period (typically 28 days).
                </Text>
              </Card>

              {/* Period Duration Picker */}
              <Card style={styles.sliderCard}>
                <View style={styles.sliderHeader}>
                  <Text style={[styles.sliderLabel, { color: colors.text }]}>Average Period Length</Text>
                  <Text style={[styles.sliderValue, { color: brandColors.accentDark }]}>{periodLength} Days</Text>
                </View>
                <View style={styles.customStepper}>
                  <Button
                    title="-"
                    onPress={() => setPeriodLength(prev => Math.max(3, prev - 1))}
                    variant="secondary"
                    style={styles.stepBtn}
                    textStyle={{ fontSize: 32, lineHeight: 36, marginTop: -4 }}
                  />
                  <Text style={[styles.stepperValText, { color: colors.text }]}>{periodLength}</Text>
                  <Button
                    title="+"
                    onPress={() => setPeriodLength(prev => Math.min(10, prev + 1))}
                    variant="secondary"
                    style={styles.stepBtn}
                    textStyle={{ fontSize: 28, lineHeight: 32, marginTop: -2 }}
                  />
                </View>
                <Text style={[styles.helperLabel, { color: colors.textSecondary }]}>
                  How many days your bleeding usually lasts (typically 5 days).
                </Text>
              </Card>
            </View>
          </Animated.View>
        );

      case 4:
        return (
          <Animated.View key="step4" entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Do you use birth control?</Text>
            <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
              Adding a birth control method schedules daily reminders and custom streak trackers.
            </Text>

            <ScrollView contentContainerStyle={styles.optionsList} showsVerticalScrollIndicator={false}>
              {[
                { id: 'NONE', label: 'No contraception / None' },
                { id: 'PILL', label: 'Oral Contraceptive Pill' },
                { id: 'IUD', label: 'Intrauterine Device (IUD)' },
                { id: 'PATCH', label: 'Contraceptive Patch' },
                { id: 'RING', label: 'Vaginal Ring' },
                { id: 'INJECTION', label: 'Hormonal Injection' },
                { id: 'OTHER', label: 'Other Method' },
              ].map(item => {
                const isSelected = birthControl === item.id;
                return (
                  <Card
                    key={item.id}
                    onPress={() => selectBirthControl(item.id as BirthControlType)}
                    style={[
                      styles.selectableCardCompact,
                      isSelected && { borderColor: brandColors.primary, borderWidth: 1.5 },
                    ]}
                  >
                    <View style={styles.compactRow}>
                      <Text style={[styles.compactLabel, { color: colors.text }]}>{item.label}</Text>
                      {isSelected && <Ionicons name="checkmark-circle" size={20} color={brandColors.primaryDark} />}
                    </View>
                  </Card>
                );
              })}
            </ScrollView>
          </Animated.View>
        );

      case 5:
        return (
          <Animated.View key="step5" entering={FadeInRight} exiting={FadeOutLeft} style={styles.stepContainer}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Privacy & Notifications</Text>
            <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
              Configure your secure settings. CycleSync respects your health privacy.
            </Text>

            <View style={styles.settingsGroup}>
              {/* Notifications Toggle */}
              <Card style={styles.settingsCard}>
                <View style={styles.settingsRow}>
                  <View style={styles.settingsTextCol}>
                    <Text style={[styles.settingsLabel, { color: colors.text }]}>Cycle Reminders</Text>
                    <Text style={[styles.settingsDesc, { color: colors.textSecondary }]}>
                      Get notifications about upcoming period start dates and ovulation days.
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      setEnableNotifications(!enableNotifications);
                    }}
                    style={[
                      styles.toggleSwitch,
                      { backgroundColor: enableNotifications ? brandColors.primary : colors.border },
                    ]}
                  >
                    <View style={[styles.toggleCircle, enableNotifications && { alignSelf: 'flex-end' }]} />
                  </Pressable>
                </View>
              </Card>

              {/* Security Lock PIN Toggle */}
              <Card style={styles.settingsCard}>
                <View style={styles.settingsRow}>
                  <View style={styles.settingsTextCol}>
                    <Text style={[styles.settingsLabel, { color: colors.text }]}>Secure PIN App Lock</Text>
                    <Text style={[styles.settingsDesc, { color: colors.textSecondary }]}>
                      Locks the app with a 4-digit PIN every time you reopen it.
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      setWantsPin(!wantsPin);
                      if (wantsPin) setPinLock('');
                    }}
                    style={[
                      styles.toggleSwitch,
                      { backgroundColor: wantsPin ? brandColors.primary : colors.border },
                    ]}
                  >
                    <View style={[styles.toggleCircle, wantsPin && { alignSelf: 'flex-end' }]} />
                  </Pressable>
                </View>

                {wantsPin && (
                  <View style={styles.pinEntryWrapper}>
                    <Text style={[styles.pinLabel, { color: colors.text }]}>Set 4-Digit PIN Code:</Text>
                    <View style={styles.pinInputRow}>
                      {[0, 1, 2, 3].map(i => (
                        <Pressable
                          key={i}
                          style={[styles.pinBox, { borderColor: colors.border }]}
                        >
                          <Text style={[styles.pinTextText, { color: colors.text }]}>
                            {pinLock[i] ? '•' : ''}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    
                    {/* Compact PIN Buttons */}
                    <View style={styles.compactKeypad}>
                      {['123', '456', '789'].map((row, rIdx) => (
                        <View key={rIdx} style={styles.keypadRow}>
                          {row.split('').map(num => (
                            <Pressable
                              key={num}
                              onPress={() => {
                                if (pinLock.length < 4) {
                                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  setPinLock(p => p + num);
                                }
                              }}
                              style={[styles.keypadKey, { backgroundColor: colors.surfaceSecondary }]}
                            >
                              <Text style={[styles.keypadKeyText, { color: colors.text }]}>{num}</Text>
                            </Pressable>
                          ))}
                        </View>
                      ))}
                      <View style={styles.keypadRow}>
                        <View style={[styles.keypadKey, { backgroundColor: 'transparent' }]} />
                        <Pressable
                          onPress={() => {
                            if (pinLock.length < 4) {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setPinLock(p => p + '0');
                            }
                          }}
                          style={[styles.keypadKey, { backgroundColor: colors.surfaceSecondary }]}
                        >
                          <Text style={[styles.keypadKeyText, { color: colors.text }]}>0</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setPinLock(p => p.slice(0, -1));
                          }}
                          style={[styles.keypadKey, { backgroundColor: 'transparent' }]}
                        >
                          <Ionicons name="backspace" size={18} color={colors.text} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                )}
              </Card>
            </View>
          </Animated.View>
        );
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header with dots */}
      <View style={styles.header}>
        {step > 1 ? (
          <Pressable onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
        ) : (
          <View style={styles.backBtnPlaceholder} />
        )}

        <View style={styles.dotsRow}>
          {[1, 2, 3, 4, 5].map(i => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i <= step ? brandColors.primary : colors.border },
                i === step && { width: 18 },
              ]}
            />
          ))}
        </View>

        <View style={styles.backBtnPlaceholder} />
      </View>

      {/* Main Content Area */}
      <View style={styles.content}>{renderStepContent()}</View>

      {/* Bottom Button Row */}
      <View style={styles.footer}>
        <Button
          title={step === 5 ? 'Get Started 🌸' : 'Continue'}
          onPress={handleNext}
          variant="primary"
          style={styles.nextBtn}
          disabled={step === 5 && wantsPin && pinLock.length !== 4}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 50,
  },
  backBtn: {
    padding: 8,
  },
  backBtnPlaceholder: {
    width: 40,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepContainer: {
    flex: 1,
    marginTop: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  stepDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  optionsList: {
    flex: 1,
  },
  selectableCard: {
    marginVertical: 6,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  selectableCardCompact: {
    marginVertical: 4,
    borderWidth: 1.5,
    borderColor: 'transparent',
    padding: 14,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  optionIcon: {
    marginRight: 16,
  },
  optionTextWrapper: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  calendarWrapper: {
    marginTop: 10,
  },
  slidersWrapper: {
    flex: 1,
  },
  sliderCard: {
    marginVertical: 10,
    padding: 16,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  sliderValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  customStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginHorizontal: 20,
    paddingHorizontal: 0,
  },
  stepperValText: {
    fontSize: 24,
    fontWeight: '700',
    width: 40,
    textAlign: 'center',
  },
  helperLabel: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 10 : 20,
  },
  nextBtn: {
    width: '100%',
  },
  // Privacy step
  settingsGroup: {
    flex: 1,
  },
  settingsCard: {
    marginVertical: 8,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingsTextCol: {
    flex: 1,
    marginRight: 16,
  },
  settingsLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  settingsDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pinEntryWrapper: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E0EC',
    paddingTop: 16,
    alignItems: 'center',
  },
  pinLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
  },
  pinInputRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  pinBox: {
    width: 40,
    height: 40,
    borderWidth: 1.5,
    borderRadius: 8,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinTextText: {
    fontSize: 24,
    fontWeight: '800',
  },
  compactKeypad: {
    width: '90%',
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 4,
  },
  keypadKey: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadKeyText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
