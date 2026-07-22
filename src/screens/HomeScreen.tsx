import React from 'react';
import { StyleSheet, View, Text, ScrollView, Platform, StatusBar, Pressable, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useCycleStore } from '../store/useCycleStore';
import { CycleRing } from '../components/CycleRing';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Ionicons } from '@expo/vector-icons';
import { getPhaseForDate, formatLocalDate, getDaysDifference } from '../utils/predictions';
import * as Haptics from 'expo-haptics';

export const HomeScreen = ({ navigation }: any) => {
  const { colors, brandColors } = useTheme();

  const currentProfile = useCycleStore(state => state.currentProfile);
  const cycles = useCycleStore(state => state.cycles);
  const dailyLogs = useCycleStore(state => state.dailyLogs);
  const predictions = useCycleStore(state => state.predictions);
  const seedDemo = useCycleStore(state => state.seedDemo);

  const todayStr = formatLocalDate(new Date());

  // Check if we need to show the "Seed Demo Data" callout
  // We show it if the user has only 1 period logged (the onboarding estimate) and no other days
  const showSeedBanner = cycles.filter(c => !c.is_predicted).length < 2;

  // Retrieve today's logged details if any
  const todaysLog = dailyLogs.find(l => l.date === todayStr);

  // Compute current cycle info
  const getDashboardData = () => {
    const activeCycles = cycles.filter(c => !c.is_predicted);
    
    // Default fallback values if no database records are found
    const defaultData = {
      dayOfCycle: 1,
      cycleLength: 28,
      phase: 'follicular' as const,
      daysUntilPeriod: 14,
      fertilityLevel: 'low' as const,
      confidence: 'low' as const,
    };

    if (activeCycles.length === 0 || !predictions) {
      return defaultData;
    }

    const lastPeriod = activeCycles[activeCycles.length - 1];
    
    // Get phase info
    const dayInfo = getPhaseForDate(todayStr, lastPeriod.start_date, predictions);
    
    // Days until period: difference between predicted period start and today
    const daysUntil = getDaysDifference(predictions.predictedPeriodStart, todayStr);

    return {
      dayOfCycle: dayInfo.dayOfCycle,
      cycleLength: predictions.averageCycleLength,
      phase: dayInfo.phase,
      daysUntilPeriod: daysUntil,
      fertilityLevel: dayInfo.fertilityLevel,
      confidence: predictions.confidence,
    };
  };

  const dashboard = getDashboardData();

  // Custom advice tips based on phase
  const getPhaseAdvice = () => {
    switch (dashboard.phase) {
      case 'menstrual':
        return {
          title: 'Rest & Restore',
          text: 'Your hormone levels are at their lowest. Focus on gentle yoga, light walks, warm herbal tea, and staying hydrated. Listen to your body and rest.',
          icon: 'cafe-outline',
          bg: brandColors.menstrual + '15',
        };
      case 'follicular':
        return {
          title: 'Time to Plan & Create',
          text: 'Estrogen is rising, lifting your energy, mood, and focus. This is the optimal window to schedule workouts, start new projects, or socialize.',
          icon: 'bulb-outline',
          bg: brandColors.follicular + '15',
        };
      case 'ovulation':
        return {
          title: 'Peak Energy & Vitality',
          text: 'Estrogen and LH levels are peaking, meaning fertility is at its highest. You may experience increased confidence, high energy, and a higher sex drive.',
          icon: 'flame-outline',
          bg: brandColors.ovulation + '15',
        };
      case 'luteal':
        return {
          title: 'Settle Down & Nest',
          text: 'Progesterone is rising, preparing your body. Energy may drop, and you might experience PMS. Practice self-care, sleep more, and eat nutrient-dense meals.',
          icon: 'moon-outline',
          bg: brandColors.luteal + '15',
        };
    }
  };

  const advice = getPhaseAdvice();

  const handleQuickLog = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('LogModal', { date: todayStr });
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const message = `Hi! I'm currently in the ${dashboard.phase} phase of my cycle on CycleSync. (Day ${dashboard.dayOfCycle} of ${dashboard.cycleLength})`;
      await Share.share({
        message,
        title: 'My Cycle Phase',
      });
    } catch (error) {
      console.log('Error sharing', error);
    }
  };

  const handleSeedPress = () => {
    seedDemo();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle={colors.text === '#1C1B1F' ? 'dark-content' : 'light-content'} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Greeting */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>Hello,</Text>
            <Text style={[styles.profileName, { color: colors.text }]}>{currentProfile?.name || 'User'}</Text>
          </View>
          
          {dashboard.confidence === 'low' && (
            <View style={[styles.confidenceBadge, { backgroundColor: brandColors.accent + '30' }]}>
              <Ionicons name="alert-circle" size={14} color={brandColors.accentDark} style={styles.badgeIcon} />
              <Text style={[styles.confidenceText, { color: colors.text }]}>Low Confidence</Text>
            </View>
          )}
        </View>

        {/* Demo Data Seeder Banner */}
        {showSeedBanner && (
          <Pressable onPress={handleSeedPress} style={styles.seedBannerPressable}>
            <Card hasShadow={false} style={[styles.seedBanner, { backgroundColor: brandColors.primary + '15', borderColor: brandColors.primary }]}>
              <View style={styles.seedBannerRow}>
                <Ionicons name="sparkles" size={20} color={brandColors.primaryDark} />
                <View style={styles.seedBannerTextWrapper}>
                  <Text style={[styles.seedTitle, { color: colors.text }]}>Seed Demo History</Text>
                  <Text style={[styles.seedDesc, { color: colors.textSecondary }]}>
                    Tap to instantly populate 6 months of period records and symptoms. Perfect for exploring graphs!
                  </Text>
                </View>
              </View>
            </Card>
          </Pressable>
        )}

        {/* Circular Progress Ring Widget */}
        <CycleRing
          dayOfCycle={dashboard.dayOfCycle}
          cycleLength={dashboard.cycleLength}
          phase={dashboard.phase}
          daysUntilPeriod={dashboard.daysUntilPeriod}
          fertilityLevel={dashboard.fertilityLevel}
        />

        {/* Quick Log Button */}
        <View style={styles.quickLogArea}>
          <Button
            title={todaysLog && todaysLog.flow !== 'NONE' ? "Edit Today's Logs" : "Quick Log Today's Day"}
            onPress={handleQuickLog}
            variant={todaysLog && todaysLog.flow !== 'NONE' ? "outline" : "primary"}
            icon={<Ionicons name="medical-outline" size={18} color={todaysLog && todaysLog.flow !== 'NONE' ? brandColors.primaryDark : '#FFF'} />}
          />
          <Button
            title="Share Phase with Partner"
            onPress={handleShare}
            variant="outline"
            style={{ marginTop: 12 }}
            icon={<Ionicons name="heart-outline" size={18} color={brandColors.primaryDark} />}
          />
        </View>

        {/* Today's Log Summary Pill Icons */}
        {todaysLog && (todaysLog.flow !== 'NONE' || todaysLog.symptoms !== '' || todaysLog.moods !== '') && (
          <Card style={styles.todaySummaryCard}>
            <Text style={[styles.summaryCardTitle, { color: colors.text }]}>Logged Today</Text>
            <View style={styles.loggedChipsRow}>
              {todaysLog.flow !== 'NONE' && (
                <View style={[styles.summaryChip, { backgroundColor: brandColors.menstrual + '25' }]}>
                  <Text style={[styles.summaryChipText, { color: colors.text }]}>Flow: {todaysLog.flow}</Text>
                </View>
              )}
              {todaysLog.symptoms.split(',').filter(Boolean).map(symptom => (
                <View key={symptom} style={[styles.summaryChip, { backgroundColor: colors.surfaceSecondary }]}>
                  <Text style={[styles.summaryChipText, { color: colors.text }]}>{symptom}</Text>
                </View>
              ))}
              {todaysLog.moods.split(',').filter(Boolean).map(mood => (
                <View key={mood} style={[styles.summaryChip, { backgroundColor: brandColors.follicular + '25' }]}>
                  <Text style={[styles.summaryChipText, { color: colors.text }]}>{mood}</Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Dynamic Advice/Tip Card */}
        <Card style={styles.adviceCard}>
          <View style={styles.adviceHeader}>
            <Ionicons name={advice.icon as any} size={22} color={advice.bg.substring(0, 7)} style={styles.adviceIcon} />
            <Text style={[styles.adviceTitle, { color: colors.text }]}>{advice.title}</Text>
          </View>
          <Text style={[styles.adviceText, { color: colors.textSecondary }]}>{advice.text}</Text>
        </Card>

        {/* Low Confidence Detail Callout */}
        {dashboard.confidence === 'low' && (
          <Card style={styles.warningCard}>
            <Text style={[styles.warningTitle, { color: colors.text }]}>Predictions Estimate</Text>
            <Text style={[styles.warningText, { color: colors.textSecondary }]}>
              You have logged fewer than 3 full periods. We are currently using your onboarding estimate of {dashboard.cycleLength} days.
              CycleSync predictions will become highly accurate once you log a few cycles.
            </Text>
          </Card>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeIcon: {
    marginRight: 4,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  // Seed Banner
  seedBannerPressable: {
    marginVertical: 4,
  },
  seedBanner: {
    borderWidth: 1,
    padding: 14,
  },
  seedBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seedBannerTextWrapper: {
    flex: 1,
    marginLeft: 12,
  },
  seedTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  seedDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  quickLogArea: {
    width: '100%',
    marginVertical: 8,
  },
  adviceCard: {
    marginTop: 12,
    borderWidth: 1,
    borderStyle: 'dotted',
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  adviceIcon: {
    marginRight: 8,
  },
  adviceTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  adviceText: {
    fontSize: 13,
    lineHeight: 19,
  },
  warningCard: {
    marginTop: 12,
    borderWidth: 1,
    borderStyle: 'dotted',
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    lineHeight: 18,
  },
  todaySummaryCard: {
    marginTop: 8,
    padding: 12,
  },
  summaryCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  loggedChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  summaryChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  summaryChipText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
