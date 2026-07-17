import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useCycleStore } from '../store/useCycleStore';
import { LineChart, BarChart } from '../components/CustomChart';
import { Card } from '../components/Card';
import { getDaysDifference, parseLocalDate } from '../utils/predictions';
import { Ionicons } from '@expo/vector-icons';

export const InsightsScreen = () => {
  const { colors, brandColors } = useTheme();

  const currentProfile = useCycleStore(state => state.currentProfile);
  const cycles = useCycleStore(state => state.cycles);
  const dailyLogs = useCycleStore(state => state.dailyLogs);

  const activeCycles = cycles.filter(c => !c.is_predicted);

  // 1. Process Cycle Length Trends (Line Chart)
  const getCycleTrendData = () => {
    if (activeCycles.length < 2) {
      return { data: [], labels: [] };
    }

    const trends: number[] = [];
    const labels: string[] = [];

    // Compute intervals between successive start dates
    for (let i = 0; i < activeCycles.length - 1; i++) {
      const cycleLen = getDaysDifference(activeCycles[i + 1].start_date, activeCycles[i].start_date);
      if (cycleLen >= 15 && cycleLen <= 90) {
        trends.push(cycleLen);
        
        // Month name label of start date
        const dateObj = parseLocalDate(activeCycles[i].start_date);
        const monthAbbr = dateObj.toLocaleString('en-US', { month: 'short' });
        labels.push(monthAbbr);
      }
    }

    // Keep last 6 points
    return {
      data: trends.slice(-6),
      labels: labels.slice(-6),
    };
  };

  const cycleTrend = getCycleTrendData();

  // 2. Process Symptom Frequencies (Bar Chart)
  const getSymptomFrequencies = () => {
    const counts: { [key: string]: number } = {};
    
    for (const log of dailyLogs) {
      if (log.symptoms) {
        const list = log.symptoms.split(',');
        for (const sym of list) {
          if (sym) {
            counts[sym] = (counts[sym] || 0) + 1;
          }
        }
      }
    }

    // Convert to array and sort
    const items = Object.keys(counts).map(key => ({
      label: key.charAt(0).toUpperCase() + key.slice(1),
      count: counts[key],
    }));

    items.sort((a, b) => b.count - a.count);
    return items.slice(0, 4); // Top 4 symptoms
  };

  const symptomFreq = getSymptomFrequencies();

  // 3. Process Mood Frequencies (Bar Chart)
  const getMoodFrequencies = () => {
    const counts: { [key: string]: number } = {};
    
    for (const log of dailyLogs) {
      if (log.moods) {
        const list = log.moods.split(',');
        for (const mood of list) {
          if (mood) {
            counts[mood] = (counts[mood] || 0) + 1;
          }
        }
      }
    }

    const items = Object.keys(counts).map(key => ({
      label: key.charAt(0).toUpperCase() + key.slice(1),
      count: counts[key],
    }));

    items.sort((a, b) => b.count - a.count);
    return items.slice(0, 4); // Top 4 moods
  };

  const moodFreq = getMoodFrequencies();

  // 4. Process Basal Body Temperature BBT (Line Chart) for current cycle
  const getBBTTrend = () => {
    if (activeCycles.length === 0) return { data: [], labels: [] };
    
    // Get logs in current cycle (from last period start to today)
    const lastStart = activeCycles[activeCycles.length - 1].start_date;
    
    // Filter and sort ascending by date
    const bbtLogs = dailyLogs
      .filter(l => l.date >= lastStart && l.bbt !== undefined)
      .sort((a, b) => a.date.localeCompare(b.date));

    const data = bbtLogs.map(l => l.bbt as number);
    const labels = bbtLogs.map(l => {
      const parts = l.date.split('-');
      return `${parts[1]}/${parts[2]}`; // MM/DD
    });

    // Sub-sample or limit labels to avoid overlap
    const step = Math.ceil(labels.length / 5) || 1;
    const cleanLabels = labels.map((lbl, idx) => (idx % step === 0 ? lbl : ''));

    // Coverline (average of first 14 days, commonly used as a baseline to detect ovulation shift)
    let coverline: number | undefined;
    if (data.length >= 5) {
      const follicularTemps = data.slice(0, 14);
      const sum = follicularTemps.reduce((a, b) => a + b, 0);
      coverline = sum / follicularTemps.length;
    }

    return {
      data,
      labels: cleanLabels,
      coverline,
    };
  };

  const bbtTrend = getBBTTrend();
  const showFertility = currentProfile?.fertility_mode === 1;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Screen Title */}
        <Text style={[styles.title, { color: colors.text }]}>Cycle Insights</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Understand symptoms, mood changes, and patterns over time.
        </Text>

        {/* 1. Cycle Length Trends */}
        <Card style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Cycle Length Trend</Text>
          <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
            Duration of your last 6 logged cycles (days).
          </Text>

          {cycleTrend.data.length >= 2 ? (
            <LineChart
              data={cycleTrend.data}
              labels={cycleTrend.labels}
              yMin={20}
              yMax={40}
              unit="d"
            />
          ) : (
            <View style={styles.emptyChartContainer}>
              <Ionicons name="stats-chart" size={36} color={colors.textSecondary} style={{ opacity: 0.4, marginBottom: 8 }} />
              <Text style={[styles.emptyChartText, { color: colors.textSecondary }]}>
                We need logs from at least 3 periods to calculate cycle length trends.
              </Text>
            </View>
          )}
        </Card>

        {/* 2. Basal Body Temperature (BBT) Chart (Fertility Mode Only) */}
        {showFertility && (
          <Card style={styles.chartCard}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Basal Body Temp (BBT)</Text>
            <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
              Daily temperature curves logged in your current cycle.
            </Text>

            {bbtTrend.data.length >= 2 ? (
              <LineChart
                data={bbtTrend.data}
                labels={bbtTrend.labels}
                unit="°"
                showDataLabels={false}
                targetLine={bbtTrend.coverline}
              />
            ) : (
              <View style={styles.emptyChartContainer}>
                <Ionicons name="thermometer-outline" size={36} color={colors.textSecondary} style={{ opacity: 0.4, marginBottom: 8 }} />
                <Text style={[styles.emptyChartText, { color: colors.textSecondary }]}>
                  Log your daily temperature (BBT) in the Logger screen to display this chart.
                </Text>
              </View>
            )}
          </Card>
        )}

        {/* 3. Symptoms Frequency Bar Chart */}
        <Card style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Most Common Symptoms</Text>
          <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
            How many times each symptom was logged.
          </Text>

          {symptomFreq.length > 0 ? (
            <BarChart data={symptomFreq} />
          ) : (
            <View style={styles.emptyChartContainer}>
              <Ionicons name="fitness-outline" size={36} color={colors.textSecondary} style={{ opacity: 0.4, marginBottom: 8 }} />
              <Text style={[styles.emptyChartText, { color: colors.textSecondary }]}>
                Log symptoms (cramps, headaches, bloating) in the Logger to see frequencies here.
              </Text>
            </View>
          )}
        </Card>

        {/* 4. Mood Patterns Bar Chart */}
        <Card style={styles.chartCard}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Mood Frequency</Text>
          <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
            Tracking your emotional fluctuations.
          </Text>

          {moodFreq.length > 0 ? (
            <BarChart data={moodFreq} />
          ) : (
            <View style={styles.emptyChartContainer}>
              <Ionicons name="happy-outline" size={36} color={colors.textSecondary} style={{ opacity: 0.4, marginBottom: 8 }} />
              <Text style={[styles.emptyChartText, { color: colors.textSecondary }]}>
                Log moods in the Daily Logger to populate this chart.
              </Text>
            </View>
          )}
        </Card>

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
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 16,
  },
  chartCard: {
    marginVertical: 10,
    padding: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  chartSubtitle: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 16,
  },
  emptyChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 12,
  },
  emptyChartText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
