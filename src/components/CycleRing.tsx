import React, { useEffect } from 'react';
import { StyleSheet, View, Text, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { CyclePhase } from '../utils/predictions';

interface CycleRingProps {
  dayOfCycle: number;
  cycleLength: number;
  phase: CyclePhase;
  daysUntilPeriod: number;
  fertilityLevel: 'low' | 'high' | 'peak';
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const CycleRing: React.FC<CycleRingProps> = ({
  dayOfCycle,
  cycleLength,
  phase,
  daysUntilPeriod,
  fertilityLevel,
}) => {
  const { colors, brandColors } = useTheme();
  const { width } = useWindowDimensions();

  // Scale ring size relative to screen size (responsive)
  const size = Math.min(width * 0.7, 260);
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useSharedValue(0);

  // Determine active phase color
  const getPhaseColor = () => {
    switch (phase) {
      case 'menstrual':
        return brandColors.menstrual;
      case 'follicular':
        return brandColors.follicular;
      case 'ovulation':
        return brandColors.ovulation;
      case 'luteal':
        return brandColors.luteal;
      default:
        return brandColors.primary;
    }
  };

  const activeColor = getPhaseColor();

  // Reset and animate progress when day or cycle changes
  useEffect(() => {
    progress.value = 0;
    const targetProgress = Math.min(Math.max(dayOfCycle / (cycleLength || 28), 0.02), 1.0);
    progress.value = withDelay(
      300,
      withTiming(targetProgress, {
        duration: 1500,
        easing: Easing.out(Easing.quad),
      })
    );
  }, [dayOfCycle, cycleLength]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progress.value);
    return {
      strokeDashoffset,
    };
  });

  // Display texts based on state
  const getPhaseLabel = () => {
    switch (phase) {
      case 'menstrual': return 'Menstrual Phase';
      case 'follicular': return 'Follicular Phase';
      case 'ovulation': return 'Ovulation';
      case 'luteal': return 'Luteal Phase';
    }
  };

  const getFertilityLabel = () => {
    if (phase === 'menstrual') return 'Low Fertility';
    if (fertilityLevel === 'peak') return 'Peak Fertility 🔥';
    if (fertilityLevel === 'high') return 'High Fertility ✨';
    return 'Low Fertility';
  };

  const getPeriodCountText = () => {
    if (phase === 'menstrual') return 'Period Day';
    if (daysUntilPeriod === 0) return 'Period expected today';
    if (daysUntilPeriod < 0) return `Period late by ${Math.abs(daysUntilPeriod)} days`;
    return `Period in ${daysUntilPeriod} ${daysUntilPeriod === 1 ? 'day' : 'days'}`;
  };

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={activeColor} />
            <Stop offset="100%" stopColor={activeColor + 'DD'} />
          </LinearGradient>
        </Defs>

        {/* Track Circle (Background) */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth - 2}
          fill="none"
        />

        {/* Active Fill Circle */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#ringGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {/* Centered Labels */}
      <View style={[styles.labelContainer, { width: size - 40, height: size - 40 }]}>
        <Text style={[styles.cycleDayLabel, { color: colors.textSecondary }]}>
          {phase === 'menstrual' ? `Day ${dayOfCycle}` : `Day ${dayOfCycle}`}
        </Text>
        
        <Text style={[styles.mainLabel, { color: colors.text }]}>
          {getPhaseLabel()}
        </Text>

        <View style={[styles.pill, { backgroundColor: activeColor + '30' }]}>
          <Text style={[styles.pillText, { color: colors.text }]}>
            {getFertilityLabel()}
          </Text>
        </View>

        <Text style={[styles.periodCountdown, { color: colors.textSecondary }]}>
          {getPeriodCountText()}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  svg: {
    position: 'absolute',
  },
  labelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  cycleDayLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  mainLabel: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: 4,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginVertical: 6,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  periodCountdown: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
});
