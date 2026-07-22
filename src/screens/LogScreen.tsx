import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, Pressable, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useCycleStore } from '../store/useCycleStore';
import { formatLocalDate } from '../utils/predictions';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

export const LogScreen = ({ route, navigation }: any) => {
  const { colors, brandColors } = useTheme();
  const insets = useSafeAreaInsets();

  const logDate = route?.params?.date || formatLocalDate(new Date());

  const dailyLogs = useCycleStore(state => state.dailyLogs);
  const saveDailyLogEntry = useCycleStore(state => state.saveDailyLogEntry);
  const deleteDailyLogEntry = useCycleStore(state => state.deleteDailyLogEntry);

  const existingLog = dailyLogs.find(l => l.date === logDate);

  const [flow, setFlow] = useState<'NONE' | 'SPOTTING' | 'LIGHT' | 'MEDIUM' | 'HEAVY'>('NONE');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [moods, setMoods] = useState<string[]>([]);
  const [discharge, setDischarge] = useState<'DRY' | 'STICKY' | 'CREAMY' | 'WATERY' | 'EGG_WHITE' | 'NONE'>('NONE');
  const [sleepQuality, setSleepQuality] = useState(0.8);
  const [sexDrive, setSexDrive] = useState(0.5);
  const [bbt, setBbt] = useState<string>('');
  const [ovulationTest, setOvulationTest] = useState<'POSITIVE' | 'NEGATIVE' | 'NONE'>('NONE');
  const [pillTaken, setPillTaken] = useState<0 | 1>(0);
  const [notes, setNotes] = useState('');

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
      setPillTaken(existingLog.pill_taken || 0);
      setNotes(existingLog.notes || '');
    } else {
      setFlow('NONE');
      setSymptoms([]);
      setMoods([]);
      setDischarge('NONE');
      setSleepQuality(0.8);
      setSexDrive(0.5);
      setBbt('');
      setOvulationTest('NONE');
      setPillTaken(0);
      setNotes('');
    }
  }, [existingLog, logDate]);

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
    setSymptoms(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const toggleMood = (id: string) => {
    Haptics.selectionAsync();
    setMoods(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const handleSave = () => {
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
      pill_taken: pillTaken,
      notes,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (navigation.canGoBack()) navigation.goBack();
  };

  const handleClear = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    deleteDailyLogEntry(logDate);
    if (navigation.canGoBack()) navigation.goBack();
  };

  const KeyboardWrapper = Platform.OS === 'ios' ? KeyboardAvoidingView : View as any;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>Log Daily Health</Text>
            <Text style={[styles.dateSub, { color: colors.textSecondary }]}>
              {new Date(logDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
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

        {/* Section 1: Flow Intensity */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Flow Intensity</Text>
          <View style={styles.flowRow}>
            {[
              { id: 'NONE', label: 'None', icon: 'ellipse-outline' },
              { id: 'SPOTTING', label: 'Spotting', icon: 'water' },
              { id: 'LIGHT', label: 'Light', icon: 'water' },
              { id: 'MEDIUM', label: 'Medium', icon: 'water' },
              { id: 'HEAVY', label: 'Heavy', icon: 'water' },
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
                  <View style={[
                    styles.flowCircle,
                    { backgroundColor: colors.surfaceSecondary },
                    isSelected && { borderWidth: 2, borderColor: brandColors.primary, transform: [{ scale: 1.05 }], backgroundColor: colors.surface }
                  ]}>
                    <Ionicons 
                      name={item.icon as any} 
                      size={20} 
                      color={isSelected ? brandColors.primary : colors.textSecondary} 
                    />
                  </View>
                  <Text style={[styles.flowLabel, { color: isSelected ? colors.text : colors.textSecondary }]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Section 2: Symptoms */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>How do you feel physically?</Text>
          <View style={styles.chipsGrid}>
            {SYMPTOMS_LIST.map(item => {
              const isSelected = symptoms.includes(item.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => toggleSymptom(item.id)}
                  style={[
                    styles.chipBtn,
                    { backgroundColor: colors.surfaceSecondary },
                    isSelected && { backgroundColor: brandColors.primaryLight + (colors.background === '#000000' ? '30' : ''), borderColor: brandColors.primary }
                  ]}
                >
                  <Text style={[styles.chipText, { color: isSelected ? brandColors.primaryDark : colors.text }]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Section 3: Moods */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>What is your emotional state?</Text>
          <View style={styles.chipsGrid}>
            {MOODS_LIST.map(item => {
              const isSelected = moods.includes(item.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => toggleMood(item.id)}
                  style={[
                    styles.chipBtn,
                    { backgroundColor: colors.surfaceSecondary },
                    isSelected && { backgroundColor: brandColors.primaryLight + (colors.background === '#000000' ? '30' : ''), borderColor: brandColors.primary }
                  ]}
                >
                  <Text style={[styles.chipText, { color: isSelected ? brandColors.primaryDark : colors.text }]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Section 4: Discharge */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Cervical Fluid Consistency</Text>
          <View style={styles.chipsGrid}>
            {[
              { id: 'DRY', label: 'Dry / None 🌵' },
              { id: 'STICKY', label: 'Sticky 🪵' },
              { id: 'CREAMY', label: 'Creamy 🍦' },
              { id: 'WATERY', label: 'Watery 💧' },
              { id: 'EGG_WHITE', label: 'Egg White (Fertile) 🥚' },
            ].map(item => {
              const isSelected = (item.id === 'DRY' && (discharge === 'DRY' || discharge === 'NONE')) || discharge === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setDischarge(item.id as any);
                  }}
                  style={[
                    styles.chipBtn,
                    { backgroundColor: colors.surfaceSecondary },
                    isSelected && { backgroundColor: brandColors.teal + (colors.background === '#000000' ? '30' : '20'), borderColor: brandColors.teal }
                  ]}
                >
                  <Text style={[styles.chipText, { color: isSelected ? brandColors.teal : colors.text }]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Section 5: Sleep & Libido */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Sleep & Sex Drive</Text>

          <Text style={[styles.fieldLabel, { color: colors.text }]}>Sleep Quality</Text>
          <View style={[styles.chipsGrid, { marginTop: 8, marginBottom: 16 }]}>
            {[
              { val: 0.2, label: 'Poor 🥱' },
              { val: 0.5, label: 'Fair 😐' },
              { val: 0.8, label: 'Good 😌' },
              { val: 1.0, label: 'Great 🤩' },
            ].map(item => {
              const isSelected = Math.abs(sleepQuality - item.val) < 0.15;
              return (
                <Pressable
                  key={item.label}
                  onPress={() => setSleepQuality(item.val)}
                  style={[
                    styles.chipBtn,
                    { backgroundColor: colors.surfaceSecondary },
                    isSelected && { backgroundColor: brandColors.primaryLight + (colors.background === '#000000' ? '30' : ''), borderColor: brandColors.primary }
                  ]}
                >
                  <Text style={[styles.chipText, { color: isSelected ? brandColors.primaryDark : colors.text }]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.text }]}>Sex Drive (Libido)</Text>
          <View style={[styles.chipsGrid, { marginTop: 8 }]}>
            {[
              { val: 0.0, label: 'None 🧊' },
              { val: 0.3, label: 'Low 📉' },
              { val: 0.6, label: 'Medium 🔥' },
              { val: 1.0, label: 'High 🌋' },
            ].map(item => {
              const isSelected = Math.abs(sexDrive - item.val) < 0.15;
              return (
                <Pressable
                  key={item.label}
                  onPress={() => setSexDrive(item.val)}
                  style={[
                    styles.chipBtn,
                    { backgroundColor: colors.surfaceSecondary },
                    isSelected && { backgroundColor: brandColors.primaryLight + (colors.background === '#000000' ? '30' : ''), borderColor: brandColors.primary }
                  ]}
                >
                  <Text style={[styles.chipText, { color: isSelected ? brandColors.primaryDark : colors.text }]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Section 6: Fertility & Meds */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Fertility & Medication</Text>

          <Text style={[styles.fieldLabel, { color: colors.text, marginBottom: 8 }]}>Basal Body Temp (°C)</Text>
          <TextInput
            value={bbt}
            onChangeText={setBbt}
            placeholder="e.g. 36.5"
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
            style={[styles.textInput, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.text }]}
          />

          <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 16, marginBottom: 8 }]}>Ovulation Test (LH Kit)</Text>
          <View style={styles.chipsGrid}>
            {[
              { id: 'NONE', label: 'Not Tested 🤷‍♀️' },
              { id: 'NEGATIVE', label: 'Negative (-)' },
              { id: 'POSITIVE', label: 'Positive (+)' },
            ].map(item => {
              const isSelected = ovulationTest === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setOvulationTest(item.id as any)}
                  style={[
                    styles.chipBtn,
                    { backgroundColor: colors.surfaceSecondary },
                    isSelected && { backgroundColor: brandColors.teal + (colors.background === '#000000' ? '30' : '20'), borderColor: brandColors.teal }
                  ]}
                >
                  <Text style={[styles.chipText, { color: isSelected ? brandColors.teal : colors.text }]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.fieldLabel, { color: colors.text, marginTop: 16, marginBottom: 8 }]}>Daily Medication / Pill</Text>
          <View style={styles.chipsGrid}>
            {[
              { id: 0, label: 'Not Taken ❌' },
              { id: 1, label: 'Taken ✅' },
            ].map(item => {
              const isSelected = pillTaken === item.id;
              return (
                <Pressable
                  key={item.id}
                  onPress={() => setPillTaken(item.id as 0 | 1)}
                  style={[
                    styles.chipBtn,
                    { backgroundColor: colors.surfaceSecondary },
                    isSelected && { backgroundColor: brandColors.teal + (colors.background === '#000000' ? '30' : '20'), borderColor: brandColors.teal }
                  ]}
                >
                  <Text style={[styles.chipText, { color: isSelected ? brandColors.teal : colors.text }]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Section 7: Notes */}
        <View style={[styles.sectionCard, { backgroundColor: colors.surface, shadowColor: colors.shadow }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes & Journal</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Write down any additional details..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            style={[styles.textArea, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border, color: colors.text }]}
          />
        </View>
      </ScrollView>
      
      {/* Solid Bottom Bar (Not Floating) */}
      <View style={[styles.staticBottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.bottomBarContent}>
          {existingLog && (
            <Pressable onPress={handleClear} style={[styles.deleteBtn, { backgroundColor: colors.surface, borderColor: brandColors.menstrual }]}>
              <Ionicons name="trash-outline" size={20} color={brandColors.menstrual} />
            </Pressable>
          )}
          <Pressable onPress={handleSave} style={[styles.saveBtn, { overflow: 'hidden' }]}>
            <LinearGradient
              colors={['#B388FF', '#7C4DFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <Text style={styles.saveText}>Save Log Entry</Text>
            <Ionicons name="checkmark-circle" size={18} color="#FFF" style={{ marginLeft: 6 }} />
          </Pressable>
        </View>
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
  },
  dateSub: {
    fontSize: 13,
    marginTop: 4,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  flowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
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
  flowLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  staticBottomBar: {
    borderTopWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  bottomBarContent: {
    flexDirection: 'row',
  },
  saveBtn: {
    flex: 1,
    height: 50,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  deleteBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 12,
  },
});
