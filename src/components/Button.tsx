import React from 'react';
import { StyleSheet, Text, Pressable, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../utils/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    if (disabled || loading) return;
    scale.value = withSpring(0.96, { damping: 10, stiffness: 300 });
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  const handlePress = () => {
    if (disabled || loading) return;
    // Trigger tactile click
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  // Resolve styles based on variant
  const getStyles = () => {
    let buttonStyle: ViewStyle = styles.primary;
    let titleStyle: TextStyle = styles.primaryText;

    switch (variant) {
      case 'secondary':
        buttonStyle = styles.secondary;
        titleStyle = styles.secondaryText;
        break;
      case 'outline':
        buttonStyle = styles.outline;
        titleStyle = styles.outlineText;
        break;
      case 'text':
        buttonStyle = styles.text;
        titleStyle = styles.textText;
        break;
      case 'danger':
        buttonStyle = styles.danger;
        titleStyle = styles.dangerText;
        break;
    }

    return { buttonStyle, titleStyle };
  };

  const { buttonStyle, titleStyle } = getStyles();

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.base,
        buttonStyle,
        disabled && styles.disabled,
        style,
        animatedStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? '#FFF' : COLORS.primary}
        />
      ) : (
        <>
          {icon && <Animated.View style={styles.iconContainer}>{icon}</Animated.View>}
          <Text style={[styles.textBase, titleStyle, textStyle]}>{title}</Text>
        </>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginVertical: 8,
  },
  textBase: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  // Variant styles
  primary: {
    backgroundColor: COLORS.primaryDark,
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondary: {
    backgroundColor: COLORS.primaryLight,
  },
  secondaryText: {
    color: COLORS.primaryDark,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primaryDark,
  },
  outlineText: {
    color: COLORS.primaryDark,
  },
  text: {
    backgroundColor: 'transparent',
    height: 40,
    paddingHorizontal: 12,
  },
  textText: {
    color: COLORS.primaryDark,
  },
  danger: {
    backgroundColor: COLORS.accentDark,
  },
  dangerText: {
    color: '#FFFFFF',
  },
});
