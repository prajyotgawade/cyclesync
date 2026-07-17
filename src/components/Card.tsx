import React from 'react';
import { StyleSheet, View, ViewStyle, Pressable, StyleProp } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../hooks/useTheme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padding?: number;
  borderVariant?: 'none' | 'subtle' | 'gradient-accent';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  padding = 16,
  borderVariant = 'none',
}) => {
  const { colors, shadow } = useTheme();
  const scale = useSharedValue(1);

  const isClickable = !!onPress;

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    if (!isClickable) return;
    scale.value = withSpring(0.98, { damping: 10, stiffness: 300 });
  };

  const handlePressOut = () => {
    if (!isClickable) return;
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  const handlePress = () => {
    if (!isClickable) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const cardStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: borderVariant === 'subtle' ? 1 : 0,
    borderRadius: 20,
    padding,
  };

  if (isClickable) {
    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        style={[
          styles.base,
          cardStyle,
          shadow,
          style,
          animatedStyle,
        ]}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <View style={[styles.base, cardStyle, shadow, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    marginVertical: 8,
    width: '100%',
  },
});
