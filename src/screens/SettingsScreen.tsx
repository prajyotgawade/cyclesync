import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useCycleStore } from '../store/useCycleStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Ionicons } from '@expo/vector-icons';
import { exportToPDF, exportToCSV } from '../services/export';
import { formatLocalDate, addDaysToDate } from '../utils/predictions';
import * as Haptics from 'expo-haptics';

type GoalType = 'TRACK' | 'AVOID' | 'CONCEIVE' | 'MENOPAUSE';
type BirthControlType = 'PILL' | 'IUD' | 'PATCH' | 'RING' | 'INJECTION' | 'NONE' | 'OTHER';

export const SettingsScreen = ({ navigation }: any) => {
  const { colors, brandColors } = useTheme();

  const currentProfile = useCycleStore(state => state.currentProfile);
  const profiles = useCycleStore(state => state.profiles);
  const cycles = useCycleStore(state => state.cycles);
  const dailyLogs = useCycleStore(state => state.dailyLogs);
  
  const createOrUpdateProfile = useCycleStore(state => state.createOrUpdateProfile);
  const setThemeSetting = useCycleStore(state => state.setThemeSetting);
  const activeTheme = useCycleStore(state => state.theme);
  const pinCode = useCycleStore(state => state.pinCode);
  const setPinCode = useCycleStore(state => state.setPinCode);
  const logout = useCycleStore(state => state.logout);
  const seedDemo = useCycleStore(state => state.seedDemo);
  const clearAllData = useCycleStore(state => state.clearAllData);

  // Local States
  const [profileName, setProfileName] = useState(currentProfile?.name || '');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // App Lock local configuration
  const [wantsPin, setWantsPin] = useState(pinCode !== null);
  const [pinEntry, setPinEntry] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);

  const saveProfileSettings = (fields: any) => {
    createOrUpdateProfile(fields);
  };

  const handleSignOut = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
    navigation.replace('AuthNavigator');
  };

  const handleExportPDF = async () => {
    if (!currentProfile) return;
    setExportLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Set 6 months range
    const today = formatLocalDate(new Date());
    const sixMonthsAgo = addDaysToDate(today, -180);

    try {
      await exportToPDF(currentProfile, cycles, dailyLogs, {
        startDate: sixMonthsAgo,
        endDate: today,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportCSV = async () => {
    if (!currentProfile) return;
    setExportLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const today = formatLocalDate(new Date());
    const sixMonthsAgo = addDaysToDate(today, -180);

    try {
      await exportToCSV(currentProfile, dailyLogs, {
        startDate: sixMonthsAgo,
        endDate: today,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setExportLoading(false);
    }
  };

  // Toggle app lock setup
  const handlePinLockToggle = () => {
    Haptics.selectionAsync();
    if (pinCode) {
      // Clear PIN
      setPinCode(null);
      setWantsPin(false);
    } else {
      // Prompt for PIN entry
      setPinEntry('');
      setShowPinModal(true);
    }
  };

  const savePin = async () => {
    if (pinEntry.length === 4) {
      await setPinCode(pinEntry);
      setWantsPin(true);
      setShowPinModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>

        {/* 1. Profile Card */}
        <Card style={styles.settingsCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Profile & Goal</Text>
          
          <View style={styles.inputCol}>
            <Text style={[styles.fieldLabel, { color: colors.text, marginBottom: 8 }]}>Your Name</Text>
            <TextInput
              value={profileName}
              onChangeText={(text) => {
                setProfileName(text);
                saveProfileSettings({ name: text });
              }}
              placeholder="e.g. Jane"
              placeholderTextColor={colors.textSecondary + '70'}
              style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
            />
          </View>

          <View style={styles.inputCol}>
            <Text style={[styles.fieldLabel, { color: colors.text, marginBottom: 8 }]}>Primary Goal</Text>
            <View style={[styles.segmentedControl, { backgroundColor: colors.surfaceSecondary }]}>
              {[
                { id: 'TRACK', label: 'Track' },
                { id: 'AVOID', label: 'Avoid' },
                { id: 'CONCEIVE', label: 'Conceive' },
              ].map(item => {
                const isSelected = currentProfile?.goal === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => saveProfileSettings({
                      goal: item.id as GoalType,
                      fertility_mode: item.id === 'CONCEIVE' ? 1 : 0
                    })}
                    style={[
                      styles.segmentBtn,
                      isSelected && { backgroundColor: brandColors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                        isSelected && { fontWeight: '700' },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Fertility Mode Toggle */}
          <View style={[styles.switchRow, { borderTopColor: colors.border }]}>
            <View style={styles.switchLabelCol}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Fertility Mode (BBT Charts)</Text>
              <Text style={[styles.switchDesc, { color: colors.textSecondary }]}>
                Enables Basal Body Temperature tracking and ovulation test logging.
              </Text>
            </View>
            <Pressable
              onPress={() => saveProfileSettings({ fertility_mode: currentProfile?.fertility_mode === 1 ? 0 : 1 })}
              style={[
                styles.toggleSwitch,
                { backgroundColor: currentProfile?.fertility_mode === 1 ? brandColors.primary : colors.border },
              ]}
            >
              <View style={[styles.toggleCircle, currentProfile?.fertility_mode === 1 && { alignSelf: 'flex-end' }]} />
            </Pressable>
          </View>
        </Card>

        {/* 2. Cycle Intervals Defaults */}
        <Card style={styles.settingsCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Cycle Parameters</Text>
          
          <View style={styles.stepperRow}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Default Cycle Length</Text>
            <View style={styles.stepperControl}>
              <Pressable
                onPress={() => saveProfileSettings({ average_cycle_length: Math.max(21, (currentProfile?.average_cycle_length || 28) - 1) })}
                style={[styles.stepperBtn, { backgroundColor: colors.surfaceSecondary }]}
              >
                <Ionicons name="remove" size={16} color={colors.text} />
              </Pressable>
              <Text style={[styles.stepperVal, { color: colors.text }]}>{currentProfile?.average_cycle_length} d</Text>
              <Pressable
                onPress={() => saveProfileSettings({ average_cycle_length: Math.min(45, (currentProfile?.average_cycle_length || 28) + 1) })}
                style={[styles.stepperBtn, { backgroundColor: colors.surfaceSecondary }]}
              >
                <Ionicons name="add" size={16} color={colors.text} />
              </Pressable>
            </View>
          </View>

          <View style={styles.stepperRow}>
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Default Period Length</Text>
            <View style={styles.stepperControl}>
              <Pressable
                onPress={() => saveProfileSettings({ average_period_length: Math.max(3, (currentProfile?.average_period_length || 5) - 1) })}
                style={[styles.stepperBtn, { backgroundColor: colors.surfaceSecondary }]}
              >
                <Ionicons name="remove" size={16} color={colors.text} />
              </Pressable>
              <Text style={[styles.stepperVal, { color: colors.text }]}>{currentProfile?.average_period_length} d</Text>
              <Pressable
                onPress={() => saveProfileSettings({ average_period_length: Math.min(10, (currentProfile?.average_period_length || 5) + 1) })}
                style={[styles.stepperBtn, { backgroundColor: colors.surfaceSecondary }]}
              >
                <Ionicons name="add" size={16} color={colors.text} />
              </Pressable>
            </View>
          </View>
        </Card>

        {/* 3. Contraception Reminders */}
        <Card style={styles.settingsCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Birth Control Tracker</Text>
          <View style={styles.inputCol}>
            <Text style={[styles.fieldLabel, { color: colors.text, marginBottom: 8 }]}>Contraceptive Method</Text>
            <View style={[styles.segmentedControlScroll, { backgroundColor: colors.surfaceSecondary }]}>
              {[
                { id: 'NONE', label: 'None' },
                { id: 'PILL', label: 'Pill' },
                { id: 'IUD', label: 'IUD' },
                { id: 'PATCH', label: 'Patch' },
              ].map(item => {
                const isSelected = currentProfile?.birth_control_type === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => saveProfileSettings({ birth_control_type: item.id as BirthControlType })}
                    style={[
                      styles.segmentBtnCompact,
                      isSelected && { backgroundColor: brandColors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentTextCompact,
                        { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Card>

        {/* 4. Display Settings */}
        <Card style={styles.settingsCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>App Settings</Text>
          
          {/* Theme segment selector */}
          <View style={styles.inputCol}>
            <Text style={[styles.fieldLabel, { color: colors.text, marginBottom: 8 }]}>Theme Preferences</Text>
            <View style={[styles.segmentedControl, { backgroundColor: colors.surfaceSecondary }]}>
              {[
                { id: 'light', label: 'Light' },
                { id: 'dark', label: 'Dark' },
                { id: 'system', label: 'System' },
              ].map(item => {
                const isSelected = activeTheme === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setThemeSetting(item.id as any)}
                    style={[
                      styles.segmentBtn,
                      isSelected && { backgroundColor: brandColors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Secure PIN Lock Toggle */}
          <View style={[styles.switchRow, { borderTopColor: colors.border }]}>
            <View style={styles.switchLabelCol}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Security App Lock PIN</Text>
              <Text style={[styles.switchDesc, { color: colors.textSecondary }]}>
                Ask for a secure PIN code every time you open CycleSync.
              </Text>
            </View>
            <Pressable
              onPress={handlePinLockToggle}
              style={[
                styles.toggleSwitch,
                { backgroundColor: wantsPin ? brandColors.primary : colors.border },
              ]}
            >
              <View style={[styles.toggleCircle, wantsPin && { alignSelf: 'flex-end' }]} />
            </Pressable>
          </View>
        </Card>

        {/* 5. Medical Reports Export */}
        <Card style={styles.settingsCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Export & Reports</Text>
          <Text style={[styles.switchDesc, { color: colors.textSecondary, marginBottom: 12 }]}>
            Export your 6-month logged cycles, symptoms, moods, and temperatures for medical consultations.
          </Text>

          <Button
            title="Export Doctor PDF Report"
            onPress={handleExportPDF}
            variant="outline"
            loading={exportLoading}
            icon={<Ionicons name="document-text-outline" size={18} color={brandColors.primaryDark} />}
            style={styles.exportBtn}
          />
          <Button
            title="Export Tabular CSV Data"
            onPress={handleExportCSV}
            variant="outline"
            loading={exportLoading}
            icon={<Ionicons name="share-outline" size={18} color={brandColors.primaryDark} />}
            style={styles.exportBtn}
          />
        </Card>

        {/* 6. Diagnostics & Sandbox */}
        <Card style={styles.settingsCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Diagnostics & Dev Actions</Text>
          
          <Button
            title="Seed 6-Month Mock History"
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              seedDemo();
            }}
            variant="secondary"
            icon={<Ionicons name="refresh-circle-outline" size={18} color={brandColors.primaryDark} />}
          />

          <Button
            title="Clear Cache & Local Tables"
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              clearAllData();
            }}
            variant="danger"
            icon={<Ionicons name="trash-outline" size={18} color="#FFFFFF" />}
          />
        </Card>

        {/* 7. Footer Options */}
        <View style={styles.settingsFooter}>
          <Pressable onPress={() => setShowPrivacyModal(true)} style={styles.privacyLink}>
            <Text style={[styles.privacyLinkText, { color: brandColors.primaryDark }]}>
              Read Privacy Policy & Encrypted Notice
            </Text>
          </Pressable>

          <Button title="Sign Out of Google" onPress={handleSignOut} variant="outline" style={styles.signOutBtn} />
          
          <Text style={[styles.appVersionText, { color: colors.textSecondary }]}>
            CycleSync version 1.0.0 (Expo SQLite)
          </Text>
        </View>

      </ScrollView>

      {/* Security PIN code creation Modal */}
      <Modal visible={showPinModal} animationType="slide" transparent={true}>
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Set App Lock PIN</Text>
            <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
              Enter a 4-digit code to secure your cycle logs.
            </Text>

            <View style={styles.pinIndicatorRow}>
              {[0, 1, 2, 3].map(i => (
                <View
                  key={i}
                  style={[
                    styles.pinIndicatorDot,
                    { borderColor: colors.border },
                    pinEntry[i] && { backgroundColor: brandColors.primary },
                  ]}
                />
              ))}
            </View>

            {/* Keypad */}
            <View style={styles.modalKeypad}>
              {['123', '456', '789'].map((row, rIdx) => (
                <View key={rIdx} style={styles.modalKeypadRow}>
                  {row.split('').map(num => (
                    <Pressable
                      key={num}
                      onPress={() => {
                        if (pinEntry.length < 4) {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setPinEntry(p => p + num);
                        }
                      }}
                      style={[styles.modalKey, { backgroundColor: colors.surfaceSecondary }]}
                    >
                      <Text style={[styles.modalKeyText, { color: colors.text }]}>{num}</Text>
                    </Pressable>
                  ))}
                </View>
              ))}
              <View style={styles.modalKeypadRow}>
                <Pressable
                  onPress={() => setShowPinModal(false)}
                  style={[styles.modalKey, { backgroundColor: 'transparent' }]}
                >
                  <Text style={[styles.modalKeyCancelText, { color: colors.textSecondary }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    if (pinEntry.length < 4) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setPinEntry(p => p + '0');
                    }
                  }}
                  style={[styles.modalKey, { backgroundColor: colors.surfaceSecondary }]}
                >
                  <Text style={[styles.modalKeyText, { color: colors.text }]}>0</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPinEntry(p => p.slice(0, -1));
                  }}
                  style={[styles.modalKey, { backgroundColor: 'transparent' }]}
                >
                  <Ionicons name="backspace" size={20} color={colors.text} />
                </Pressable>
              </View>
            </View>

            <Button
              title="Confirm PIN"
              onPress={savePin}
              variant="primary"
              disabled={pinEntry.length !== 4}
              style={{ width: '100%', marginTop: 20 }}
            />
          </View>
        </View>
      </Modal>

      {/* Plain language Privacy notice Modal */}
      <Modal visible={showPrivacyModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainerFull, { backgroundColor: colors.surface }]}>
            <View style={[styles.modalFullHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalFullTitle, { color: colors.text }]}>Privacy & Encryption Policy</Text>
              <Pressable
                onPress={() => setShowPrivacyModal(false)}
                style={[styles.modalCloseCircle, { backgroundColor: colors.surfaceSecondary }]}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.privacyScroll} showsVerticalScrollIndicator={false}>
              <Text style={[styles.privacyHeadline, { color: colors.text }]}>Your Health Data is Safe</Text>
              <Text style={[styles.privacyBody, { color: colors.textSecondary }]}>
                CycleSync is built on an offline-first architecture. This means 100% of your cycle tracking logs, symptoms, moods, notes, and Basal Body Temperatures are written directly onto your device's internal hard drive using an encrypted SQLite database.
              </Text>

              <Text style={[styles.privacyHeadline, { color: colors.text }]}>No Third-Party Analytics</Text>
              <Text style={[styles.privacyBody, { color: colors.textSecondary }]}>
                We do not integrate any external tracking pixels, ad networks, or third-party analytic services (like Google Analytics, Facebook SDK, or Mixpanel) which could compromise or leak your medical profiles.
              </Text>

              <Text style={[styles.privacyHeadline, { color: colors.text }]}>Optional Cloud Backup</Text>
              <Text style={[styles.privacyBody, { color: colors.textSecondary }]}>
                If you choose to sync your account using Supabase cloud backup, your rows are securely guarded via Postgres Row Level Security (RLS) policies. Only your authenticated Google OAuth account holds the cryptographic keys required to query your data.
              </Text>

              <Text style={[styles.privacyHeadline, { color: colors.text }]}>Security App Lock</Text>
              <Text style={[styles.privacyBody, { color: colors.textSecondary }]}>
                Ensure no one with physical access to your device can read your cycles by turning on the PIN Lock setting.
              </Text>
            </ScrollView>

            <Button title="I Understand" onPress={() => setShowPrivacyModal(false)} variant="primary" style={{ width: '100%', marginTop: 12 }} />
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 16,
  },
  settingsCard: {
    marginVertical: 10,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 16,
  },
  inputCol: {
    marginVertical: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  segmentedControl: {
    flexDirection: 'row',
    height: 40,
    borderRadius: 10,
    padding: 2,
  },
  segmentBtn: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
  },
  segmentedControlScroll: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 10,
    padding: 2,
  },
  segmentBtnCompact: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  segmentTextCompact: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Switch
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  switchLabelCol: {
    flex: 1,
    marginRight: 16,
  },
  switchDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  toggleSwitch: {
    width: 48,
    height: 26,
    borderRadius: 13,
    padding: 2,
    justifyContent: 'center',
  },
  toggleCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
  },
  // Steppers
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  stepperControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperVal: {
    fontSize: 14,
    fontWeight: '700',
    width: 44,
    textAlign: 'center',
  },
  exportBtn: {
    marginVertical: 4,
  },
  // Footer
  settingsFooter: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  privacyLink: {
    marginVertical: 16,
  },
  privacyLinkText: {
    fontSize: 12,
    fontWeight: '600',
  },
  signOutBtn: {
    width: '100%',
  },
  appVersionText: {
    fontSize: 10,
    marginTop: 16,
  },
  // Modals
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '85%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  pinIndicatorRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  pinIndicatorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    marginHorizontal: 8,
  },
  modalKeypad: {
    width: '90%',
  },
  modalKeypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 6,
  },
  modalKey: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalKeyText: {
    fontSize: 20,
    fontWeight: '600',
  },
  modalKeyCancelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Full screen Modal
  modalContainerFull: {
    width: '100%',
    height: '90%',
    marginTop: '20%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  modalFullHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 16,
    marginBottom: 16,
  },
  modalFullTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyScroll: {
    paddingBottom: 24,
  },
  privacyHeadline: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 6,
  },
  privacyBody: {
    fontSize: 12,
    lineHeight: 18,
  },
});
