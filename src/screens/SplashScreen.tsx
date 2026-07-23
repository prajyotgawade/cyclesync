import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, withSpring } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { useCycleStore } from '../store/useCycleStore';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export const SplashScreen = ({ navigation }: any) => {
  const { colors, brandColors } = useTheme();
  const { height } = useWindowDimensions();

  const isInitialized = useCycleStore(state => state.isInitialized);
  const isAuthenticated = useCycleStore(state => state.isAuthenticated);
  const pinCode = useCycleStore(state => state.pinCode);
  const isAppLocked = useCycleStore(state => state.isAppLocked);
  
  const initializeApp = useCycleStore(state => state.initializeApp);
  const unlockApp = useCycleStore(state => state.unlockApp);

  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Pulsing logo animation values
  const logoScale = useSharedValue(1);
  const errorShake = useSharedValue(0);

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated) {
        navigation.replace('AuthNavigator');
      } else if (!pinCode || !isAppLocked) {
        navigation.replace('AppNavigator');
      }
    }
  }, [isInitialized, isAuthenticated, pinCode, isAppLocked]);

  // Start pulsing logo
  useEffect(() => {
    logoScale.value = withRepeat(
      withTiming(1.15, { duration: 1200 }),
      -1, // infinite
      true // reverse
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: logoScale.value }],
    };
  });

  const pinPadAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: errorShake.value }],
    };
  });

  const handleKeyPress = (num: string) => {
    if (enteredPin.length >= 4) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const newPin = enteredPin + num;
    setEnteredPin(newPin);
    setPinError(false);

    if (newPin.length === 4) {
      if (newPin === pinCode) {
        // Unlock Success
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        unlockApp();
        navigation.replace('AppNavigator');
      } else {
        // Unlock Fail (Shake animation)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setPinError(true);
        errorShake.value = withSequence(
          withTiming(-12, { duration: 60 }),
          withTiming(12, { duration: 60 }),
          withTiming(-8, { duration: 60 }),
          withTiming(8, { duration: 60 }),
          withTiming(0, { duration: 60 }, () => {
            // clear PIN
            setEnteredPin('');
          })
        );
      }
    }
  };

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEnteredPin(prev => prev.slice(0, -1));
    setPinError(false);
  };

  // Render Secure PIN Lock Screen ONLY if locked
  if (isInitialized && isAuthenticated && pinCode && isAppLocked) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'space-around' }]}>
        <View style={styles.lockHeader}>
          <Ionicons name="lock-closed" size={36} color={brandColors.primaryDark} />
          <Text style={[styles.lockTitle, { color: colors.text }]}>Enter PIN Code</Text>
          <Text style={[styles.lockSubtitle, { color: colors.textSecondary }]}>
            CycleSync is locked to protect your health privacy.
          </Text>

          {/* PIN Indicators */}
          <Animated.View style={[styles.pinDotsRow, pinPadAnimatedStyle]}>
            {[0, 1, 2, 3].map(idx => {
              const filled = enteredPin.length > idx;
              return (
                <View
                  key={idx}
                  style={[
                    styles.pinDot,
                    { borderColor: pinError ? brandColors.accentDark : brandColors.primaryDark },
                    filled && { backgroundColor: pinError ? brandColors.accentDark : brandColors.primaryDark },
                  ]}
                />
              );
            })}
          </Animated.View>
        </View>

        {/* 3x4 Grid Pin Pad */}
        <View style={styles.pinPad}>
          {[
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
          ].map((row, rowIdx) => (
            <View key={rowIdx} style={styles.pinRow}>
              {row.map(num => (
                <Pressable
                  key={num}
                  onPress={() => handleKeyPress(num)}
                  style={[styles.pinKey, { backgroundColor: colors.surface }]}
                >
                  <Text style={[styles.pinKeyText, { color: colors.text }]}>{num}</Text>
                </Pressable>
              ))}
            </View>
          ))}
          {/* Bottom Keypad Row */}
          <View style={styles.pinRow}>
            <View style={styles.pinKeyPlaceholder} />
            <Pressable
              onPress={() => handleKeyPress('0')}
              style={[styles.pinKey, { backgroundColor: colors.surface }]}
            >
              <Text style={[styles.pinKeyText, { color: colors.text }]}>0</Text>
            </Pressable>
            <Pressable
              onPress={handleDelete}
              style={[styles.pinKey, { backgroundColor: brandColors.primaryLight, shadowOpacity: 0, elevation: 0 }]}
            >
              <Ionicons name="backspace" size={24} color={brandColors.primaryDark} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Render standard Loading Splash during transitions or initialization
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
        <View style={[styles.logoCircle, { backgroundColor: brandColors.primary }]}>
          <Ionicons name="water" size={60} color="#FFFFFF" />
        </View>
      </Animated.View>
      <Text style={[styles.logoText, { color: colors.text }]}>CycleSync</Text>
      <ActivityIndicator size="small" color={brandColors.primaryDark} style={styles.loader} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    marginBottom: 16,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C4DFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  loader: {
    marginTop: 36,
  },
  // PIN lock styles
  lockHeader: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  lockTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  lockSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  pinDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 30,
    marginVertical: 12,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    marginHorizontal: 12,
  },
  pinPad: {
    width: '100%',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  pinRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  pinKey: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  pinKeyPlaceholder: {
    width: 72,
    height: 72,
  },
  pinKeyText: {
    fontSize: 26,
    fontWeight: '600',
  },
});
