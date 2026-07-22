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
  showDataLabels?: boolean;
  showDataPoints?: boolean;
  targetLine?: number;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  labels,
  height = 180,
  yMin,
  yMax,
  unit = '',
  showDataLabels = true,
  showDataPoints = true,
  targetLine,
}) => {
  const { colors, brandColors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const padding = 30;
  const chartWidth = windowWidth - 64; // matches parent card padding

  // Calculate limits
  const actualMax = data.length > 0 ? Math.max(...data) : 1;
  const actualMin = data.length > 0 ? Math.min(...data) : 0;
  const diff = actualMax - actualMin;
  const paddingY = diff === 0 ? 0.5 : diff * 0.2;

  const maxVal = yMax !== undefined ? yMax : actualMax + paddingY;
  const minVal = yMin !== undefined ? yMin : actualMin - paddingY;
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

        {/* Target/Average Line (e.g. BBT Coverline) */}
        {targetLine !== undefined && (
          <Line
            x1={padding}
            y1={height - padding - ((targetLine - minVal) / valRange) * (height - padding * 2)}
            x2={chartWidth - padding}
            y2={height - padding - ((targetLine - minVal) / valRange) * (height - padding * 2)}
            stroke={brandColors.accentDark}
            strokeWidth={1.5}
            strokeDasharray="6 4"
          />
        )}

        {/* Data Point Circles */}
        {showDataPoints && points.map((p, idx) => (
          <React.Fragment key={idx}>
            <Circle
              cx={p.x}
              cy={p.y}
              r={data.length > 15 ? 2.5 : 5}
              fill={colors.surface}
              stroke={brandColors.primaryDark}
              strokeWidth={data.length > 15 ? 1 : 2}
            />
            {/* Value Labels above points */}
            {showDataLabels && (
              <Text
                style={[
                  styles.pointLabel,
                  { left: p.x - 12, top: p.y - 18, color: colors.text },
                ]}
              >
                {p.value}
              </Text>
            )}
          </React.Fragment>
        ))}
      </Svg>

      {/* X Axis Labels */}
      <View style={[styles.xAxisRow, { height: 20 }]}>
        {labels.map((label, idx) => {
          if (!label) return null;
          const x = padding + (idx / (labels.length - 1 || 1)) * (chartWidth - padding * 2);
          return (
            <Text 
              key={idx} 
              style={[
                styles.xAxisText, 
                { color: colors.textSecondary, position: 'absolute', left: x - 25, width: 50 }
              ]}
            >
              {label}
            </Text>
          );
        })}
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
      {/* Background Grid */}
      <View style={[StyleSheet.absoluteFill, { paddingBottom: 24, paddingTop: 10 }]}>
        {[1, 0.5, 0].map((ratio, i) => (
          <View key={i} style={{ position: 'absolute', top: `${(1 - ratio) * 100}%`, width: '100%', borderTopWidth: 1, borderTopColor: colors.border, borderStyle: 'dashed', opacity: 0.5 }}>
            <Text style={{ position: 'absolute', left: 0, top: -14, fontSize: 9, color: colors.textSecondary, fontWeight: '600' }}>
              {Math.round(max * ratio)}
            </Text>
          </View>
        ))}
      </View>

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
              <View style={[styles.barTrack, { backgroundColor: colors.surfaceSecondary }]}>
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
                numberOfLines={2}
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
    width: '100%',
    marginTop: 6,
    position: 'relative',
  },
  xAxisText: {
    fontSize: 10,
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
    width: '22%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: 28,
    height: '80%',
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 8,
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
