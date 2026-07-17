import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { useCycleStore } from '../store/useCycleStore';
import { CustomCalendar } from '../components/CustomCalendar';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { formatLocalDate, getPhaseForDate, CyclePhase } from '../utils/predictions';
import { Ionicons } from '@expo/vector-icons';

export const CalendarScreen = ({ navigation }: any) => {
  const { colors, brandColors } = useTheme();

  const cycles = useCycleStore(state => state.cycles);
  const dailyLogs = useCycleStore(state => state.dailyLogs);
  const predictions = useCycleStore(state => state.predictions);

  const [selectedDate, setSelectedDate] = useState(() => formatLocalDate(new Date()));

  // Retrieve logs for the selected date
  const dayLog = dailyLogs.find(l => l.date === selectedDate);

  // Compute phase info for the selected date
  const getSelectedDayInfo = () => {
    const activeCycles = cycles.filter(c => !c.is_predicted);
    
    if (activeCycles.length === 0 || !predictions) {
      return {
        phase: 'follicular' as CyclePhase,
        dayOfCycle: 1,
        fertilityLevel: 'low' as const,
      };
    }

    // Find latest period start date relative to selected date
    // Sort ascending
    const sortedStarts = activeCycles
      .map(c => c.start_date)
      .filter(start => start <= selectedDate)
      .sort();

    const lastStart = sortedStarts.length > 0
      ? sortedStarts[sortedStarts.length - 1]
      : activeCycles[0].start_date; // fallback to absolute first if selected date is in past

    return getPhaseForDate(selectedDate, lastStart, predictions);
  };

  const dayInfo = getSelectedDayInfo();

  // Helper: display phase name
  const getPhaseName = (p: CyclePhase) => {
    switch (p) {
      case 'menstrual': return 'Menstrual Phase 🩸';
      case 'follicular': return 'Follicular Phase 🌱';
      case 'ovulation': return 'Ovulation Window 🌸';
      case 'luteal': return 'Luteal Phase 🍂';
    }
  };

  // Helper: retrieve color for phase
  const getPhaseColor = (p: CyclePhase) => {
    switch (p) {
      case 'menstrual': return brandColors.menstrual;
      case 'follicular': return brandColors.follicular;
      case 'ovulation': return brandColors.ovulation;
      case 'luteal': return brandColors.luteal;
    }
  };

  const handleEditPress = () => {
    navigation.navigate('LogModal', { date: selectedDate });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>Cycle Calendar</Text>

        {/* Custom Calendar Month Grid */}
        <CustomCalendar
          cycles={cycles}
          predictions={predictions}
          selectedDate={selectedDate}
          onDayPress={(date) => setSelectedDate(date)}
        />

        {/* Details Card for Selected Date */}
        <Card style={styles.detailsCard}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>
                {new Date(selectedDate).toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <Text style={[styles.phaseTitle, { color: getPhaseColor(dayInfo.phase) }]}>
                {getPhaseName(dayInfo.phase)}
              </Text>
            </View>
            <View style={[styles.cycleDayBadge, { backgroundColor: getPhaseColor(dayInfo.phase) + '25' }]}>
              <Text style={[styles.cycleDayText, { color: colors.text }]}>Day {dayInfo.dayOfCycle}</Text>
            </View>
          </View>

          {/* Logs summary */}
          <View style={styles.logsSummary}>
            {dayLog ? (
              <>
                {/* Flow level */}
                <View style={styles.logRow}>
                  <Text style={[styles.logLabel, { color: colors.textSecondary }]}>Flow Intensity:</Text>
                  <Text style={[styles.logVal, { color: colors.text, textTransform: 'capitalize' }]}>
                    {dayLog.flow !== 'NONE' ? `${dayLog.flow} 🩸` : 'None'}
                  </Text>
                </View>

                {/* Symptoms */}
                {dayLog.symptoms ? (
                  <View style={styles.logRowStacked}>
                    <Text style={[styles.logLabel, { color: colors.textSecondary, marginBottom: 6 }]}>Symptoms:</Text>
                    <View style={styles.chipsRow}>
                      {dayLog.symptoms.split(',').map(s => (
                        <View key={s} style={[styles.chip, { backgroundColor: colors.surfaceSecondary }]}>
                          <Text style={[styles.chipText, { color: colors.text }]}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {/* Moods */}
                {dayLog.moods ? (
                  <View style={styles.logRowStacked}>
                    <Text style={[styles.logLabel, { color: colors.textSecondary, marginBottom: 6 }]}>Moods:</Text>
                    <View style={styles.chipsRow}>
                      {dayLog.moods.split(',').map(m => (
                        <View key={m} style={[styles.chip, { backgroundColor: brandColors.follicular + '25' }]}>
                          <Text style={[styles.chipText, { color: colors.text }]}>{m}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {/* Discharge */}
                {dayLog.discharge !== 'NONE' ? (
                  <View style={styles.logRow}>
                    <Text style={[styles.logLabel, { color: colors.textSecondary }]}>Cervical Fluid:</Text>
                    <Text style={[styles.logVal, { color: colors.text, textTransform: 'capitalize' }]}>
                      {dayLog.discharge}
                    </Text>
                  </View>
                ) : null}

                {/* Temperature BBT */}
                {dayLog.bbt ? (
                  <View style={styles.logRow}>
                    <Text style={[styles.logLabel, { color: colors.textSecondary }]}>Basal Temp (BBT):</Text>
                    <Text style={[styles.logVal, { color: colors.text }]}>
                      {dayLog.bbt.toFixed(2)} °C
                    </Text>
                  </View>
                ) : null}

                {/* Pill reminder log */}
                {dayLog.pill_taken === 1 ? (
                  <View style={styles.logRow}>
                    <Text style={[styles.logLabel, { color: colors.textSecondary }]}>Birth Control Pill:</Text>
                    <Text style={[styles.logVal, { color: brandColors.tealDark }]}>
                      Taken 💊
                    </Text>
                  </View>
                ) : null}

                {/* Notes */}
                {dayLog.notes ? (
                  <View style={[styles.logRowStacked, styles.notesWrapper, { backgroundColor: colors.surfaceSecondary }]}>
                    <Text style={[styles.logLabel, { color: colors.textSecondary, marginBottom: 4 }]}>Notes:</Text>
                    <Text style={[styles.notesText, { color: colors.text }]}>{dayLog.notes}</Text>
                  </View>
                ) : null}
              </>
            ) : (
              <View style={styles.emptyLogsContainer}>
                <Ionicons name="journal-outline" size={32} color={colors.textSecondary} style={{ opacity: 0.5, marginBottom: 8 }} />
                <Text style={[styles.emptyLogsText, { color: colors.textSecondary }]}>
                  No symptoms or flow logged for this day.
                </Text>
              </View>
            )}
          </View>

          {/* Edit Button */}
          <Button
            title={dayLog ? "Edit Health Log" : "Log Symptoms & Flow"}
            onPress={handleEditPress}
            variant={dayLog ? "outline" : "primary"}
            style={styles.editBtn}
          />
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
    marginBottom: 16,
  },
  detailsCard: {
    marginTop: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E0EC',
    paddingBottom: 12,
    marginBottom: 12,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  phaseTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  cycleDayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  cycleDayText: {
    fontSize: 12,
    fontWeight: '700',
  },
  logsSummary: {
    marginBottom: 16,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  logLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  logVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  logRowStacked: {
    marginVertical: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  notesWrapper: {
    padding: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  notesText: {
    fontSize: 12,
    lineHeight: 16,
  },
  emptyLogsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyLogsText: {
    fontSize: 12,
    textAlign: 'center',
  },
  editBtn: {
    width: '100%',
  },
});
