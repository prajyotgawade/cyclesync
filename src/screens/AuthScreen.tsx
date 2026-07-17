import React, { useState } from 'react';
import { StyleSheet, View, Text, useWindowDimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useCycleStore } from '../store/useCycleStore';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export const AuthScreen = ({ navigation }: any) => {
  const { colors, brandColors } = useTheme();
  const { width } = useWindowDimensions();
  const loginWithGoogleMock = useCycleStore(state => state.loginWithGoogleMock);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    // Simulate OAuth delay
    setTimeout(async () => {
      try {
        await loginWithGoogleMock('Jane Doe', 'jane.doe@gmail.com');
        setLoading(false);
        // After login, route to Onboarding flow
        navigation.navigate('Onboarding');
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    }, 1500);
  };

  return (
    <LinearGradient
      colors={[brandColors.primaryLight, colors.background]}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />
      
      {/* Upper Logo / Title Area */}
      <Animated.View 
        entering={FadeInUp.delay(200).duration(800)}
        style={styles.headerArea}
      >
        <View style={[styles.logoCircle, { backgroundColor: brandColors.primaryDark }]}>
          <Ionicons name="water" size={48} color="#FFFFFF" />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>CycleSync</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your body, in harmony.
        </Text>
      </Animated.View>

      {/* Middle Value Proposition Card */}
      <Animated.View 
        entering={FadeInDown.delay(500).duration(800)}
        style={styles.cardArea}
      >
        <Card style={styles.propCard}>
          <View style={styles.propRow}>
            <View style={[styles.iconWrapper, { backgroundColor: brandColors.menstrual + '30' }]}>
              <Ionicons name="calendar-sharp" size={20} color={brandColors.accentDark} />
            </View>
            <View style={styles.propTextWrapper}>
              <Text style={[styles.propTitle, { color: colors.text }]}>Smart Cycle Predictions</Text>
              <Text style={[styles.propDesc, { color: colors.textSecondary }]}>
                Track flow, predict periods, and map fertile cycles with a self-learning algorithm.
              </Text>
            </View>
          </View>

          <View style={styles.propRow}>
            <View style={[styles.iconWrapper, { backgroundColor: brandColors.teal + '30' }]}>
              <Ionicons name="analytics" size={20} color={brandColors.tealDark} />
            </View>
            <View style={styles.propTextWrapper}>
              <Text style={[styles.propTitle, { color: colors.text }]}>Medical Insights & BBT</Text>
              <Text style={[styles.propDesc, { color: colors.textSecondary }]}>
                Log basal body temperature, cervical mucus, and track symptom trends over months.
              </Text>
            </View>
          </View>

          <View style={styles.propRow}>
            <View style={[styles.iconWrapper, { backgroundColor: brandColors.follicular + '30' }]}>
              <Ionicons name="shield-checkmark" size={20} color={brandColors.primaryDark} />
            </View>
            <View style={styles.propTextWrapper}>
              <Text style={[styles.propTitle, { color: colors.text }]}>Secure & Private</Text>
              <Text style={[styles.propDesc, { color: colors.textSecondary }]}>
                Your data is stored safely on-device first with customizable PIN/biometric app locks.
              </Text>
            </View>
          </View>
        </Card>
      </Animated.View>

      {/* Auth Action Buttons */}
      <Animated.View 
        entering={FadeInDown.delay(800).duration(800)}
        style={styles.buttonArea}
      >
        <Button
          title="Continue with Google"
          variant="primary"
          loading={loading}
          onPress={handleGoogleSignIn}
          icon={<Ionicons name="logo-google" size={20} color="#FFFFFF" />}
          style={styles.signInButton}
        />
        <Text style={[styles.privacyNote, { color: colors.textSecondary }]}>
          By signing in, you agree to our secure local-encryption terms. We do not use third-party tracking.
        </Text>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  headerArea: {
    alignItems: 'center',
    marginTop: 60,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C4DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 6,
  },
  cardArea: {
    width: '100%',
  },
  propCard: {
    paddingVertical: 20,
  },
  propRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 12,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  propTextWrapper: {
    flex: 1,
  },
  propTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  propDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  buttonArea: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  signInButton: {
    width: '100%',
    backgroundColor: '#000000',
  },
  privacyNote: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 12,
    paddingHorizontal: 16,
  },
});
