const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, Pressable, Platform, KeyboardAvoidingView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useCycleStore } from '../store/useCycleStore';
import { formatLocalDate } from '../utils/predictions';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay, withTiming, FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Reusable Accordion Component
const AccordionSection = ({ title, icon, summary, isExpanded, onToggle, children, colors, brandColors }: any) => {
  return (
    <Animated.View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]} layout={LinearTransition.springify().damping(16)}>
      <Pressable 
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle();
        }} 
        style={styles.accordionHeader}
      >
        <View style={styles.accordionHeaderLeft}>
          <View style={[styles.accordionIconBg, { backgroundColor: brandColors.primary + '20' }]}>
            <Ionicons name={icon} size={18} color={brandColors.primary} />
          </View>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
            {summary && !isExpanded ? (
              <Text style={[styles.sectionSummary, { color: brandColors.primary }]}>{summary}</Text>
            ) : null}
          </View>
        </View>
        <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={colors.textSecondary} />
      </Pressable>

      {isExpanded && (
        <Animated.View 
          entering={FadeIn.duration(200)} 
          exiting={FadeOut.duration(200)}
          style={styles.accordionContent}
        >
          {children}
        </Animated.View>
      )}
    </Animated.View>
  );
};

export const LogScreen = ({ route, navigation }: any) => {
  const { colors, brandColors } = useTheme();
  const { height } = useWindowDimensions();

  const logDate = route?.params?.date || formatLocalDate(new Date());

  const dailyLogs = useCycleStore(state => state.dailyLogs);
  const saveDailyLogEntry = useCycleStore(state => state.saveDailyLogEntry);
  const deleteDailyLogEntry = useCycleStore(state => state.deleteDailyLogEntry);

  const existingLog = dailyLogs.find(l => l.date === logDate);

  // States for Accordions
  const [expandedSections, setExpandedSections] = useState({
    flow: true,
    symptoms: false,
    moods: false,
    discharge: false,
    sleepLibido: false,
    fertility: false,
    notes: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Log Data States
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

      // Smart expand: If they have data in a section, expand it by default to review it easily
      setExpandedSections({
        flow: true,
        symptoms: !!existingLog.symptoms,
        moods: !!existingLog.moods,
        discharge: existingLog.discharge !== 'NONE',
        sleepLibido: true,
        fertility: !!existingLog.bbt || existingLog.ovulation_test !== 'NONE' || existingLog.pill_taken === 1,
        notes: !!existingLog.notes,
      });

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
    showCelebration.value = withTiming(1, { duration: 250 }, () => {
      checkScale.value = withSpring(1, { damping: 10, stiffness: 200 }, () => {
        withDelay(800, withTiming(0, { duration: 200 }, () => {
          if (navigation.canGoBack()) navigation.goBack();
        }));
      });
    });
  };

  const handleClear = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    deleteDailyLogEntry(logDate);
    if (navigation.canGoBack()) navigation.goBack();
  };

  const celebrationBgStyle = useAnimatedStyle(() => ({
    opacity: showCelebration.value,
    zIndex: showCelebration.value > 0 ? 100 : -1,
    pointerEvents: showCelebration.value > 0 ? 'auto' : 'none',
  }));

  const checkMarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.keyboardContainer, { backgroundColor: colors.background, height }]}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        
        {/* Full Screen Celebration Overlay */}
        <Animated.View style={[styles.celebrationOverlay, celebrationBgStyle]}>
          <Animated.View style={[styles.celebrationCircle, { backgroundColor: brandColors.teal }, checkMarkStyle]}>
            <Ionicons name="checkmark-sharp" size={60} color="#FFFFFF" />
          </Animated.View>
          <Text style={styles.celebrationText}>Log Saved!</Text>
        </Animated.View>

        <ScrollView
          style={{ flex: 1, backgroundColor: colors.background }}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Log Daily Health</Text>
              <Text style={[styles.dateSub, { color: brandColors.primary }]}>
                {new Date(logDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (navigation.canGoBack()) navigation.goBack();
              }}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSecondary }]}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          {/* Section 1: Flow */}
          <AccordionSection
            title="Flow Intensity"
            icon="water-outline"
            summary={flow !== 'NONE' ? \`\${flow.charAt(0) + flow.slice(1).toLowerCase()}\` : 'None'}
            isExpanded={expandedSections.flow}
            onToggle={() => toggleSection('flow')}
            colors={colors}
            brandColors={brandColors}
          >
            <View style={styles.flowRow}>
              {[
                { id: 'NONE', label: 'None', color: colors.border, icon: 'close-outline' },
                { id: 'SPOTTING', label: 'Spot', color: brandColors.menstrual + '40', icon: 'water-outline' },
                { id: 'LIGHT', label: 'Light', color: brandColors.menstrual + '70', icon: 'water' },
                { id: 'MEDIUM', label: 'Med', color: brandColors.menstrual, icon: 'water' },
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
                    <View style={[
                      styles.flowCircle,
                      { backgroundColor: isSelected ? item.color : colors.surfaceSecondary },
                      isSelected && { borderWidth: 2, borderColor: colors.background, transform: [{ scale: 1.05 }] },
                    ]}>
                      <Ionicons name={item.icon as any} size={22} color={isSelected ? '#FFF' : colors.textSecondary} />
                    </View>
                    <Text style={[styles.flowLabel, { color: isSelected ? colors.text : colors.textSecondary }]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </AccordionSection>

          {/* Section 2: Symptoms */}
          <AccordionSection
            title="Physical Symptoms"
            icon="body-outline"
            summary={symptoms.length > 0 ? \`\${symptoms.length} Selected\` : ''}
            isExpanded={expandedSections.symptoms}
            onToggle={() => toggleSection('symptoms')}
            colors={colors}
            brandColors={brandColors}
          >
            <View style={styles.chipsGrid}>
              {SYMPTOMS_LIST.map(item => {
                const isSelected = symptoms.includes(item.id);
                return (
                  <AnimatedPressable
                    key={item.id}
                    onPress={() => toggleSymptom(item.id)}
                    layout={LinearTransition.springify()}
                    style={[
                      styles.chipBtn,
                      { backgroundColor: isSelected ? brandColors.primary : colors.surfaceSecondary },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: isSelected ? '#FFF' : colors.text }]}>{item.label}</Text>
                  </AnimatedPressable>
                );
              })}
            </View>
          </AccordionSection>

          {/* Section 3: Moods */}
          <AccordionSection
            title="Emotional State"
            icon="happy-outline"
            summary={moods.length > 0 ? \`\${moods.length} Selected\` : ''}
            isExpanded={expandedSections.moods}
            onToggle={() => toggleSection('moods')}
            colors={colors}
            brandColors={brandColors}
          >
            <View style={styles.chipsGrid}>
              {MOODS_LIST.map(item => {
                const isSelected = moods.includes(item.id);
                return (
                  <AnimatedPressable
                    key={item.id}
                    onPress={() => toggleMood(item.id)}
                    layout={LinearTransition.springify()}
                    style={[
                      styles.chipBtn,
                      { backgroundColor: isSelected ? brandColors.follicular : colors.surfaceSecondary },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: isSelected ? '#FFF' : colors.text }]}>{item.label}</Text>
                  </AnimatedPressable>
                );
              })}
            </View>
          </AccordionSection>

          {/* Section 4: Discharge */}
          <AccordionSection
            title="Cervical Fluid"
            icon="leaf-outline"
            summary={discharge !== 'NONE' ? \`\${discharge.charAt(0) + discharge.slice(1).toLowerCase().replace('_', ' ')}\` : ''}
            isExpanded={expandedSections.discharge}
            onToggle={() => toggleSection('discharge')}
            colors={colors}
            brandColors={brandColors}
          >
            <View style={styles.chipsGrid}>
              {[
                { id: 'NONE', label: 'None 🚫' },
                { id: 'DRY', label: 'Dry 🌵' },
                { id: 'STICKY', label: 'Sticky 🪵' },
                { id: 'CREAMY', label: 'Creamy 🍦' },
                { id: 'WATERY', label: 'Watery 💧' },
                { id: 'EGG_WHITE', label: 'Egg White 🥚' },
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
                      { backgroundColor: isSelected ? brandColors.teal : colors.surfaceSecondary },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: isSelected ? '#FFF' : colors.text }]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </AccordionSection>

          {/* Section 5: Sleep & Libido */}
          <AccordionSection
            title="Sleep & Sex Drive"
            icon="bed-outline"
            summary=""
            isExpanded={expandedSections.sleepLibido}
            onToggle={() => toggleSection('sleepLibido')}
            colors={colors}
            brandColors={brandColors}
          >
            <Text style={[styles.fieldLabel, { color: colors.text }]}>Sleep Quality</Text>
            <View style={[styles.chipsGrid, { marginTop: 8, marginBottom: 20 }]}>
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
                      { backgroundColor: isSelected ? brandColors.luteal : colors.surfaceSecondary },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: isSelected ? '#FFF' : colors.text }]}>{item.label}</Text>
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
                      { backgroundColor: isSelected ? brandColors.accent : colors.surfaceSecondary },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: isSelected ? '#FFF' : colors.text }]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </AccordionSection>

          {/* Section 6: Fertility & Meds */}
          <AccordionSection
            title="Fertility & Medication"
            icon="medical-outline"
            summary=""
            isExpanded={expandedSections.fertility}
            onToggle={() => toggleSection('fertility')}
            colors={colors}
            brandColors={brandColors}
          >
            <Text style={[styles.fieldLabel, { color: colors.text, marginBottom: 8 }]}>Basal Body Temp (°C)</Text>
            <TextInput
              value={bbt}
              onChangeText={setBbt}
              placeholder="e.g. 36.5"
              placeholderTextColor={colors.textSecondary + '70'}
              keyboardType="decimal-pad"
              style={[styles.textInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
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
                      { backgroundColor: isSelected ? brandColors.primaryDark : colors.surfaceSecondary },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: isSelected ? '#FFF' : colors.text }]}>{item.label}</Text>
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
                      { backgroundColor: isSelected ? brandColors.accentDark : colors.surfaceSecondary },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: isSelected ? '#FFF' : colors.text }]}>{item.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </AccordionSection>

          {/* Section 7: Notes */}
          <AccordionSection
            title="Notes & Journal"
            icon="journal-outline"
            summary=""
            isExpanded={expandedSections.notes}
            onToggle={() => toggleSection('notes')}
            colors={colors}
            brandColors={brandColors}
          >
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Write down any additional details..."
              placeholderTextColor={colors.textSecondary + '70'}
              multiline
              numberOfLines={4}
              style={[styles.textArea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}
            />
          </AccordionSection>
          
          <View style={{ height: 120 }} /> 
        </ScrollView>
        
        {/* Floating Action Bar (Always accessible without scrolling down) */}
        <BlurView intensity={80} tint={colors.background === '#121218' ? 'dark' : 'light'} style={[styles.floatingBottomBar, { borderTopColor: colors.border }]}>
          <View style={{ flex: 1, flexDirection: 'row' }}>
            {existingLog && (
              <Pressable onPress={handleClear} style={[styles.floatingIconBtn, { backgroundColor: colors.surfaceSecondary, marginRight: 12 }]}>
                <Ionicons name="trash-outline" size={20} color={brandColors.menstrual} />
              </Pressable>
            )}
            <Pressable onPress={handleSave} style={[styles.floatingSaveBtn, { backgroundColor: brandColors.primary }]}>
              <Text style={styles.floatingSaveText}>Save Log Entry</Text>
              <Ionicons name="checkmark-circle" size={20} color="#FFF" style={{ marginLeft: 8 }} />
            </Pressable>
          </View>
        </BlurView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
  },
  dateSub: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accordionIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionSummary: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  accordionContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 4,
  },
  flowRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  flowCol: {
    alignItems: 'center',
  },
  flowCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  flowLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  textInput: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  floatingBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    borderTopWidth: 1,
  },
  floatingSaveBtn: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  floatingSaveText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  floatingIconBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 20,
  },
});
`;

fs.writeFileSync('src/screens/LogScreen.tsx', code);
console.log('LogScreen totally rebuilt with premium accordion UI!');
