import React, { useEffect } from 'react';
import { StyleSheet, View, Text, useWindowDimensions } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, useAnimatedProps, withTiming, withDelay, withSpring, Easing } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedView = Animated.createAnimatedComponent(View);

interface LineChartProps {
  data: number[];
  labels: string[];
  height?: number;
  yMin?: number;
  yMax?: number;
  unit?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  labels,
  height = 180,
  yMin,
  yMax,
  unit = '',
}) => {
  const { colors, brandColors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const padding = 30;
  const chartWidth = windowWidth - 64; // matches parent card padding

  // Calculate limits
  const maxVal = yMax !== undefined ? yMax : Math.max(...data, 1) * 1.1;
  const minVal = yMin !== undefined ? yMin : Math.min(...data, 0) * 0.9;
  const valRange = maxVal - minVal || 1;

  // Animation values
  const pathAnim = useSharedValue(1);
  const opacityAnim = useSharedValue(0);

  useEffect(() => {
    pathAnim.value = 1;
    opacityAnim.value = 0;
    pathAnim.value = withTiming(0, { duration: 1500, easing: Easing.out(Easing.cubic) });
    opacityAnim.value = withDelay(400, withTiming(1, { duration: 800 }));
  }, [data]);

  if (data.length === 0) return null;

  // Map data to SVG coordinates
  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1 || 1)) * (chartWidth - padding * 2);
    // SVG 0,0 is top-left, so we subtract mapped y from height
    const y = height - padding - ((val - minVal) / valRange) * (height - padding * 2);
    return { x, y, value: val };
  });

  // Construct SVG Path (Bezier Curve)
  let pathD = '';
  let fillD = '';

  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }

    // Path for the gradient fill area underneath
    fillD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
  }

  // Animation props/styles
  const animatedFillProps = useAnimatedProps(() => {
    return {
      opacity: opacityAnim.value,
    };
  });

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={height}>
        <Defs>
          <LinearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={brandColors.primary} stopOpacity={0.4} />
            <Stop offset="100%" stopColor={brandColors.primary} stopOpacity={0.0} />
          </LinearGradient>
        </Defs>

        {/* Y Axis Grid Lines */}
        {[0, 0.5, 1].map((ratio, idx) => {
          const y = padding + ratio * (height - padding * 2);
          const gridVal = maxVal - ratio * valRange;
          return (
            <React.Fragment key={idx}>
              <Line
                x1={padding}
                y1={y}
                x2={chartWidth - padding}
                y2={y}
                stroke={colors.border}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <Text
                style={[
                  styles.yAxisText,
                  { top: y - 8, left: 2, color: colors.textSecondary },
                ]}
              >
                {gridVal.toFixed(yMin !== undefined ? 1 : 0)}
                {unit}
              </Text>
            </React.Fragment>
          );
        })}

        {/* Shaded Area Under Curve */}
        <AnimatedPath d={fillD} fill="url(#chartGrad)" animatedProps={animatedFillProps} />

        {/* Line Path */}
        <AnimatedPath
          d={pathD}
          fill="none"
          stroke={brandColors.primaryDark}
          strokeWidth={3}
        />

        {/* Data Point Circles */}
        {points.map((p, idx) => (
          <React.Fragment key={idx}>
            <Circle
              cx={p.x}
              cy={p.y}
              r={5}
              fill={colors.surface}
              stroke={brandColors.primaryDark}
              strokeWidth={2}
            />
            {/* Value Labels above points */}
            <Text
              style={[
                styles.pointLabel,
                { left: p.x - 12, top: p.y - 18, color: colors.text },
              ]}
            >
              {p.value}
            </Text>
          </React.Fragment>
        ))}
      </Svg>

      {/* X Axis Labels */}
      <View style={[styles.xAxisRow, { paddingHorizontal: padding }]}>
        {labels.map((label, idx) => (
          <Text key={idx} style={[styles.xAxisText, { color: colors.textSecondary }]}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
};

interface BarChartProps {
  data: { label: string; count: number }[];
  maxVal?: number;
  height?: number;
}

export const BarChart: React.FC<BarChartProps> = ({ data, maxVal, height = 150 }) => {
  const { colors, brandColors } = useTheme();

  const counts = data.map(d => d.count);
  const max = maxVal || Math.max(...counts, 1);

  return (
    <View style={styles.barChartContainer}>
      <View style={[styles.barsRow, { height }]}>
        {data.map((item, idx) => {
          const barHeightRatio = Math.min(item.count / max, 1);
          
          // Animate bar height grow
          const animatedHeight = useSharedValue(0);
          
          useEffect(() => {
            animatedHeight.value = 0;
            animatedHeight.value = withDelay(
              idx * 100,
              withSpring(barHeightRatio * 100, { damping: 12, stiffness: 120 })
            );
          }, [item.count, barHeightRatio]);

          const barStyle = useAnimatedStyle(() => {
            return {
              height: `${animatedHeight.value}%`,
            };
          });

          // Alternate colors
          const barColors = [brandColors.menstrual, brandColors.follicular, brandColors.ovulation, brandColors.luteal];
          const activeBarColor = barColors[idx % barColors.length];

          return (
            <View key={idx} style={styles.barCol}>
              <View style={styles.barTrack}>
                <AnimatedView
                  style={[
                    styles.barFill,
                    { backgroundColor: activeBarColor },
                    barStyle,
                  ]}
                />
              </View>
              <Text style={[styles.barValueText, { color: colors.text }]}>{item.count}</Text>
              <Text
                numberOfLines={1}
                style={[styles.barLabelText, { color: colors.textSecondary }]}
              >
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  yAxisText: {
    position: 'absolute',
    fontSize: 9,
    fontWeight: '600',
  },
  pointLabel: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: '700',
    width: 24,
    textAlign: 'center',
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 6,
  },
  xAxisText: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  // Bar Chart styles
  barChartContainer: {
    marginVertical: 12,
    width: '100%',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    width: '100%',
    paddingBottom: 24,
  },
  barCol: {
    alignItems: 'center',
    width: '20%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: 14,
    height: '80%',
    backgroundColor: '#FAF6FC',
    borderRadius: 7,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  barValueText: {
    fontSize: 11,
    fontWeight: '700',
    marginVertical: 4,
  },
  barLabelText: {
    fontSize: 10,
    fontWeight: '600',
    width: '100%',
    textAlign: 'center',
  },
});
