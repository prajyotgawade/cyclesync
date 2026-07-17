import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, useWindowDimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { PeriodRecord, PredictionResult, getPhaseForDate, parseLocalDate, formatLocalDate, addDaysToDate } from '../utils/predictions';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface CustomCalendarProps {
  cycles: PeriodRecord[];
  predictions: PredictionResult | null;
  selectedDate: string; // YYYY-MM-DD
  onDayPress: (date: string) => void;
}

export const CustomCalendar: React.FC<CustomCalendarProps> = ({
  cycles,
  predictions,
  selectedDate,
  onDayPress,
}) => {
  const { colors, brandColors } = useTheme();
  
  // Local calendar state (active view month)
  const [viewDate, setViewDate] = useState(() => parseLocalDate(selectedDate));
  
  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth(); // 0-indexed

  // Animation values
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Month Names
  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Calculate days in the active month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get the first day of the week (0 = Sunday, etc.)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  // Reanimated style for sliding transition
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    };
  });

  const animateMonthChange = (direction: 'next' | 'prev') => {
    const slideOffset = direction === 'next' ? -80 : 80;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    translateX.value = withTiming(slideOffset, { duration: 150 }, () => {
      // Modify date on JS thread
      runOnJS(updateMonth)(direction);
      
      // Slide back in from the opposite side
      translateX.value = -slideOffset;
      translateX.value = withTiming(0, { duration: 200 });
    });
  };

  const updateMonth = (direction: 'next' | 'prev') => {
    setViewDate(prev => {
      const nextDate = new Date(prev);
      if (direction === 'next') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else {
        nextDate.setMonth(nextDate.getMonth() - 1);
      }
      return nextDate;
    });
  };

  // Check if a day has logged/predicted period, fertile window, or ovulation
  const getDayStatus = (dateStr: string) => {
    // 1. Check logged periods (cycles table)
    const activeCycles = cycles.filter(c => !c.is_predicted);
    const isLoggedPeriod = activeCycles.some(c => {
      if (c.end_date) {
        return dateStr >= c.start_date && dateStr <= c.end_date;
      }
      return dateStr === c.start_date;
    });

    if (isLoggedPeriod) {
      return { type: 'period' as const, color: brandColors.menstrual };
    }

    if (!predictions || activeCycles.length === 0) {
      return { type: 'normal' as const };
    }

    // Get predictions relative to last logged period
    const lastLogged = activeCycles[activeCycles.length - 1];
    
    // Call our prediction helper for specific phase info
    const dayInfo = getPhaseForDate(dateStr, lastLogged.start_date, predictions);

    // If date is in the past, don't show future predictions
    const todayStr = formatLocalDate(new Date());
    
    if (dayInfo.phase === 'menstrual' && dateStr >= todayStr) {
      return { type: 'predicted-period' as const, color: brandColors.menstrual };
    }

    // Check ovulation/fertility status
    const isOvulation = dateStr === predictions.predictedOvulation;
    if (isOvulation) {
      return { type: 'ovulation' as const, color: brandColors.tealDark };
    }

    const isFertile = dateStr >= predictions.fertileWindowStart && dateStr <= predictions.fertileWindowEnd;
    if (isFertile) {
      return { type: 'fertile' as const, color: brandColors.teal };
    }

    return { type: 'normal' as const };
  };

  // Generate calendar day items
  const calendarCells = [];
  
  // Fill preceding empty spaces (from previous month)
  const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth);
  
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const dateStr = `${prevMonthYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    calendarCells.push({ dayNum, dateStr, currentMonth: false });
  }

  // Fill active month days
  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    calendarCells.push({ dayNum, dateStr, currentMonth: true });
  }

  // Fill succeeding empty spaces (for next month to complete the grid of 6 weeks = 42 cells)
  const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  const remainingCells = 42 - calendarCells.length;
  
  for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
    const dateStr = `${nextMonthYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    calendarCells.push({ dayNum, dateStr, currentMonth: false });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Month Selector Header */}
      <View style={styles.header}>
        <Pressable onPress={() => animateMonthChange('prev')} style={styles.arrowButton}>
          <Ionicons name="chevron-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {MONTHS[currentMonth]} {currentYear}
        </Text>
        <Pressable onPress={() => animateMonthChange('next')} style={styles.arrowButton}>
          <Ionicons name="chevron-forward" size={20} color={colors.text} />
        </Pressable>
      </View>

      {/* Days of Week Row */}
      <View style={styles.daysOfWeekRow}>
        {DAYS_OF_WEEK.map((day, idx) => (
          <Text key={idx} style={[styles.dayOfWeekText, { color: colors.textSecondary }]}>
            {day}
          </Text>
        ))}
      </View>

      {/* Monthly Days Grid */}
      <Animated.View style={[styles.grid, animatedStyle]}>
        {calendarCells.map((cell, idx) => {
          const isSelected = cell.dateStr === selectedDate;
          const status = getDayStatus(cell.dateStr);
          const todayStr = formatLocalDate(new Date());
          const isToday = cell.dateStr === todayStr;

          // Determine styles
          let cellBg = 'transparent';
          let textColor = cell.currentMonth ? colors.text : colors.textSecondary;
          let borderStyle: any = {};
          let indicatorDot: React.ReactNode = null;

          if (status.type === 'period') {
            cellBg = brandColors.menstrual;
            textColor = '#FFFFFF';
          } else if (status.type === 'predicted-period') {
            cellBg = brandColors.menstrual + '25'; // Translucent period
            textColor = colors.text;
            borderStyle = {
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: brandColors.menstrual,
            };
          } else if (status.type === 'ovulation') {
            cellBg = brandColors.teal + '40';
            borderStyle = {
              borderWidth: 1.5,
              borderColor: brandColors.tealDark,
            };
            indicatorDot = <View style={[styles.dot, { backgroundColor: brandColors.tealDark }]} />;
          } else if (status.type === 'fertile') {
            cellBg = brandColors.teal + '20';
          }

          if (isToday && status.type === 'normal') {
            borderStyle = {
              borderWidth: 1.5,
              borderColor: colors.textSecondary,
            };
          }

          return (
            <Pressable
              key={idx}
              onPress={() => {
                Haptics.selectionAsync();
                onDayPress(cell.dateStr);
              }}
              style={styles.cellWrapper}
            >
              <View
                style={[
                  styles.cell,
                  { backgroundColor: cellBg },
                  borderStyle,
                  isSelected && {
                    borderWidth: 2,
                    borderColor: colors.tint,
                    shadowColor: colors.shadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.cellText,
                    { color: textColor },
                    isSelected && { fontWeight: '700' },
                    !cell.currentMonth && { opacity: 0.4 },
                  ]}
                >
                  {cell.dayNum}
                </Text>
                {indicatorDot}
              </View>
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 16,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  arrowButton: {
    padding: 8,
    borderRadius: 999,
  },
  daysOfWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  dayOfWeekText: {
    width: 40,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  cellWrapper: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  cell: {
    width: '90%',
    height: '90%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cellText: {
    fontSize: 13,
    fontWeight: '500',
  },
  dot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
