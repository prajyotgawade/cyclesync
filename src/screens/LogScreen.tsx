import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, Pressable, Platform, KeyboardAvoidingView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useCycleStore } from '../store/useCycleStore';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { formatLocalDate } from '../utils/predictions';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export const LogScreen = ({ route, navigation }: any) => {
  const { colors, brandColors } = useTheme();
  const { height } = useWindowDimensions();

  // Selected logging date (default to today if missing)
  const logDate = route?.params?.date || formatLocalDate(new Date());

  const dailyLogs = useCycleStore(state => state.dailyLogs);
  const saveDailyLogEntry = useCycleStore(state => state.saveDailyLogEntry);
  const deleteDailyLogEntry = useCycleStore(state => state.deleteDailyLogEntry);

  // Hydrate initial states from database if exist
  const existingLog = dailyLogs.find(l => l.date === logDate);

  const [flow, setFlow] = useState<'NONE' | 'SPOTTING' | 'LIGHT' | 'MEDIUM' | 'HEAVY'>('NONE');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [moods, setMoods] = useState<string[]>([]);
  const [discharge, setDischarge] = useState<'DRY' | 'STICKY' | 'CREAMY' | 'WATERY' | 'EGG_WHITE' | 'NONE'>('NONE');
  const [sleepQuality, setSleepQuality] = useState(0.8);
  const [sexDrive, setSexDrive] = useState(0.5);
  const [bbt, setBbt] = useState<string>('');
  const [ovulationTest, setOvulationTest] = useState<'POSITIVE' | 'NEGATIVE' | 'NONE'>('NONE');
  const [notes, setNotes] = useState('');

  // Success Celebration animation variables
  const showCelebration = useSharedValue(0);
  const checkScale = useSharedValue(0);

  useEffect(() => {
    if (existingLog) {
      setFlow(existingLog.flow);
      setSymptoms(existingLog.symptoms ? existingLog.symptoms.split(',') : []);
      setMoods(existingLog.moods ? existingLog.moods.split(',') : []);
      setDischarge(existingLog.discharge);
      setSleepQuality(existingLog.sleep_quality);
      setSexDrive(existingLog.sex_drive);
      setBbt(existingLog.bbt ? String(existingLog.bbt) : '');
      setOvulationTest(existingLog.ovulation_test);
      setNotes(existingLog.notes || '');
    } else {
      // Reset to defaults
      setFlow('NONE');
      setSymptoms([]);
      setMoods([]);
      setDischarge('NONE');
      setSleepQuality(0.8);
      setSexDrive(0.5);
      setBbt('');
      setOvulationTest('NONE');
      setNotes('');
    }
  }, [existingLog, logDate]);

  // Symptoms list
  const SYMPTOMS_LIST = [
    { id: 'cramps', label: 'Cramps ⚡' },
    { id: 'headache', label: 'Headache 🤕' },
    { id: 'bloating', label: 'Bloating 🎈' },
    { id: 'acne', label: 'Acne 🧼' },
    { id: 'fatigue', label: 'Fatigue 😴' },
    { id: 'tender breasts', label: 'Tender Breasts 🍒' },
    { id: 'backache', label: 'Backache 🩹' },
    { id: 'nausea', label: 'Nausea 🤢' },
  ];

  // Moods list
  const MOODS_LIST = [
    { id: 'happy', label: 'Happy 😊' },
    { id: 'sad', label: 'Sad 😢' },
    { id: 'irritable', label: 'Irritable 😠' },
    { id: 'anxious', label: 'Anxious 😰' },
    { id: 'energetic', label: 'Energetic ⚡' },
    { id: 'calm', label: 'Calm 😌' },
  ];

  const toggleSymptom = (id: string) => {
    Haptics.selectionAsync();
    setSymptoms(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleMood = (id: string) => {
    Haptics.selectionAsync();
    setMoods(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    // 1. Trigger database write
    saveDailyLogEntry({
      date: logDate,
      flow,
      symptoms: symptoms.join(','),
      moods: moods.join(','),
      discharge,
      sleep_quality: sleepQuality,
      sex_drive: sexDrive,
      bbt: bbt ? parseFloat(bbt) : undefined,
      ovulation_test: ovulationTest,
      notes,
    });

    // 2. Play celebration animation
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showCelebration.value = withTiming(1, { duration: 250 }, () => {
      checkScale.value = withSpring(1, { damping: 10, stiffness: 200 }, () => {
        // Close modal after delay
        withDelay(800, withTiming(0, { duration: 200 }, () => {
          // Go back on JS thread
          if (navigation.canGoBack()) {
            navigation.goBack();
          }
        }));
      });
    });
  };

  const handleClear = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    deleteDailyLogEntry(logDate);
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  // Celebration layouts
  const celebrationBgStyle = useAnimatedStyle(() => {
    return {
      opacity: showCelebration.value,
      zIndex: showCelebration.value > 0 ? 100 : -1,
      pointerEvents: showCelebration.value > 0 ? 'auto' : 'none',
    };
  });

  const checkMarkStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: checkScale.value }],
    };
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.keyboardContainer, { backgroundColor: colors.background, height }]}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {/* Absolute overlay for success checkmark */}
        <Animated.View style={[styles.celebrationOverlay, celebrationBgStyle]}>
          <Animated.View style={[styles.celebrationCircle, { backgroundColor: brandColors.teal }, checkMarkStyle]}>
            <Ionicons name="checkmark-sharp" size={60} color="#FFFFFF" />
          </Animated.View>
          <Text style={styles.celebrationText}>Log Synced!</Text>
        </Animated.View>

        <ScrollView
          style={{ flex: 1, backgroundColor: colors.background }}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Header toolbar */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Log Daily Health</Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (navigation.canGoBack()) navigation.goBack();
              }}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSecondary }]}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          <Text style={[styles.dateSub, { color: colors.textSecondary }]}>
            {new Date(logDate).toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>

          {/* Section 1: Flow Intensity */}
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Flow Intensity</Text>
            <View style={styles.flowRow}>
              {[
                { id: 'NONE', label: 'None', color: colors.border, icon: 'ellipse-outline' },
                { id: 'SPOTTING', label: 'Spotting', color: brandColors.menstrual + '40', icon: 'water-outline' },
                { id: 'LIGHT', label: 'Light', color: brandColors.menstrual + '70', icon: 'water' },
                { id: 'MEDIUM', label: 'Medium', color: brandColors.menstrual, icon: 'water' },
                { id: 'HEAVY', label: 'Heavy', color: brandColors.accentDark, icon: 'water' },
              ].map(item => {
                const isSelected = flow === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setFlow(item.id as any);
                    }}
                    style={styles.flowCol}
                  >
                    <View
                      style={[
                        styles.flowCircle,
                        { backgroundColor: isSelected ? item.color : colors.surfaceSecondary },
                        isSelected && styles.flowSelectedBorder,
                      ]}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={item.id === 'HEAVY' ? 24 : item.id === 'NONE' ? 14 : 20}
                        color={isSelected ? '#FFF' : colors.textSecondary}
                      />
                    </View>
                    <Text style={[styles.flowLabel, { color: colors.text }]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          {/* Section 2: Symptoms Multi-select */}
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>How do you feel physically?</Text>
            <View style={styles.chipsRow}>
              {SYMPTOMS_LIST.map(item => {
                const isSelected = symptoms.includes(item.id);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => toggleSymptom(item.id)}
                    style={[
                      styles.chipBtn,
                      { backgroundColor: isSelected ? brandColors.primaryLight : colors.surfaceSecondary },
                      isSelected && { borderColor: brandColors.primary, borderWidth: 1 },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: colors.text }]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          {/* Section 3: Moods Emojis */}
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>What is your emotional state?</Text>
            <View style={styles.chipsRow}>
              {MOODS_LIST.map(item => {
                const isSelected = moods.includes(item.id);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => toggleMood(item.id)}
                    style={[
                      styles.chipBtn,
                      { backgroundColor: isSelected ? brandColors.follicular + '40' : colors.surfaceSecondary },
                      isSelected && { borderColor: brandColors.follicular, borderWidth: 1 },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: colors.text }]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          {/* Section 4: Cervical Mucus / Discharge */}
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Cervical Fluid Consistency</Text>
            <View style={styles.chipsRow}>
              {[
                { id: 'NONE', label: 'Dry / None 🌵' },
                { id: 'STICKY', label: 'Sticky 🪵' },
                { id: 'CREAMY', label: 'Creamy 🍦' },
                { id: 'WATERY', label: 'Watery 💧' },
                { id: 'EGG_WHITE', label: 'Egg White (Fertile) 🥚' },
              ].map(item => {
                const isSelected = discharge === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setDischarge(item.id as any);
                    }}
                    style={[
                      styles.chipBtn,
                      { backgroundColor: isSelected ? brandColors.teal + '30' : colors.surfaceSecondary },
                      isSelected && { borderColor: brandColors.tealDark, borderWidth: 1 },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: colors.text }]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          {/* Section 5: Sliders for Sleep & Libido */}
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Sleep & Sex Drive</Text>

            <View style={styles.sliderCol}>
              <Text style={[styles.fieldLabel, { color: colors.text, marginBottom: 8 }]}>Sleep Quality</Text>
              <View style={styles.chipsRow}>
                {[
                  { val: 0.2, label: 'Poor' },
                  { val: 0.5, label: 'Fair' },
                  { val: 0.8, label: 'Good' },
                  { val: 1.0, label: 'Great' },
                ].map(item => {
                  const isSelected = Math.abs(sleepQuality - item.val) < 0.15;
                  return (
                    <Pressable
                      key={item.label}
                      onPress={() => setSleepQuality(item.val)}
                      style={[
                        styles.chipBtn,
                        { backgroundColor: isSelected ? brandColors.primaryDark : colors.surfaceSecondary },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: isSelected ? '#FFF' : colors.text }]}>{item.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.sliderCol}>
              <Text style={[styles.fieldLabel, { color: colors.text, marginBottom: 8 }]}>Sex Drive (Libido)</Text>
              <View style={styles.chipsRow}>
                {[
                  { val: 0.0, label: 'None' },
                  { val: 0.3, label: 'Low' },
                  { val: 0.6, label: 'Medium' },
                  { val: 1.0, label: 'High' },
                ].map(item => {
                  const isSelected = Math.abs(sexDrive - item.val) < 0.15;
                  return (
                    <Pressable
                      key={item.label}
                      onPress={() => setSexDrive(item.val)}
                      style={[
                        styles.chipBtn,
                        { backgroundColor: isSelected ? brandColors.primaryDark : colors.surfaceSecondary },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: isSelected ? '#FFF' : colors.text }]}>{item.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </Card>

          {/* Section 6: Fertility specifics (BBT, Ovulation Test) */}
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Fertility Markers (Optional)</Text>

            <View style={styles.inputCol}>
              <Text style={[styles.fieldLabel, { color: colors.text, marginBottom: 8 }]}>Basal Body Temp (°C)</Text>
              <TextInput
                value={bbt}
                onChangeText={setBbt}
                placeholder="e.g. 36.5"
                placeholderTextColor={colors.textSecondary + '70'}
                keyboardType="decimal-pad"
                style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
              />
            </View>

            <View style={styles.inputCol}>
              <Text style={[styles.fieldLabel, { color: colors.text, marginBottom: 8 }]}>Ovulation Test (LH Kit)</Text>
              <View style={styles.chipsRow}>
                {[
                  { id: 'NONE', label: 'Not Tested' },
                  { id: 'NEGATIVE', label: 'Negative (-)' },
                  { id: 'POSITIVE', label: 'Positive (+)' },
                ].map(item => {
                  const isSelected = ovulationTest === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setOvulationTest(item.id as any);
                      }}
                      style={[
                        styles.chipBtn,
                        { backgroundColor: isSelected ? brandColors.teal + '30' : colors.surfaceSecondary },
                        isSelected && { borderColor: brandColors.tealDark, borderWidth: 1 },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: colors.text }]}>{item.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </Card>

          {/* Section 7: Notes */}
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes & Journal</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Write down details about energy, cramps, or general feelings..."
              placeholderTextColor={colors.textSecondary + '70'}
              multiline
              numberOfLines={4}
              style={[styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
            />
          </Card>

          {/* Bottom Actions */}
          <View style={styles.footer}>
            <Button title="Save Log Entry" onPress={handleSave} variant="primary" style={styles.saveBtn} />
            {existingLog && (
              <Button title="Clear Log for this Day" onPress={handleClear} variant="danger" style={styles.deleteBtn} />
            )}
          </View>

        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 80, // Extra padding to ensure we can scroll past gesture bars
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    height: 44,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateSub: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 16,
  },
  sectionCard: {
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  flowRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 4,
  },
  flowCol: {
    alignItems: 'center',
  },
  flowCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  flowSelectedBorder: {
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  flowLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sliderCol: {
    marginVertical: 8,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  sliderValueText: {
    fontSize: 13,
    fontWeight: '600',
  },
  customStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallStepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginHorizontal: 12,
    paddingHorizontal: 0,
  },
  smallStepVal: {
    fontSize: 16,
    fontWeight: '700',
    width: 50,
    textAlign: 'center',
  },
  inputCol: {
    marginVertical: 8,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  footer: {
    marginVertical: 16,
    width: '100%',
  },
  saveBtn: {
    width: '100%',
  },
  deleteBtn: {
    width: '100%',
    marginTop: 8,
  },
  // Success overlay
  celebrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 18, 24, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  celebrationText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 20,
  },
});
