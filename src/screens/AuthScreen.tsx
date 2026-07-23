import React, { useState } from 'react';
import { StyleSheet, View, Text, useWindowDimensions, StatusBar, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useCycleStore } from '../store/useCycleStore';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabase } from '../services/supabase';

WebBrowser.maybeCompleteAuthSession();

export const AuthScreen = ({ navigation }: any) => {
  const { colors, brandColors } = useTheme();
  const { width } = useWindowDimensions();
  const loginWithRealGoogle = useCycleStore(state => state.loginWithRealGoogle);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      if (!supabase) {
        throw new Error('Supabase is not configured');
      }

      const redirectTo = makeRedirectUri({
        native: 'cyclesync://auth',
      });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });

      if (error) throw error;

      if (data?.url) {
        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (res.type === 'success') {
          const { url } = res;
          
          // Fallback parsing for hash fragment because Supabase puts tokens in the hash
          let access_token = '';
          let refresh_token = '';
          
          try {
            const { params, errorCode } = QueryParams.getQueryParams(url);
            if (errorCode) throw new Error(errorCode);
            access_token = params.access_token;
            refresh_token = params.refresh_token;
          } catch (e) {
            console.log('QueryParams error:', e);
          }

          if (!access_token && url.includes('#')) {
            const hash = url.split('#')[1];
            const hashParams = hash.split('&').reduce((acc, current) => {
              const [key, value] = current.split('=');
              acc[key] = decodeURIComponent(value);
              return acc;
            }, {} as Record<string, string>);
            
            access_token = access_token || hashParams.access_token;
            refresh_token = refresh_token || hashParams.refresh_token;
          }

          if (!access_token) {
             throw new Error('No access token. URL was: ' + url);
          }

          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          
          if (sessionError) throw sessionError;

          const user = sessionData?.session?.user;
          if (user) {
            await loginWithRealGoogle(
              user.id,
              user.user_metadata?.full_name || 'User',
              user.email || '',
              user.user_metadata?.avatar_url || '',
              access_token
            );
            navigation.navigate('Onboarding');
          } else {
            throw new Error('User data not found in session.');
          }
        } else if (res.type !== 'cancel') {
          throw new Error('Auth session failed with type: ' + res.type);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Google Sign-In Failed: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[brandColors.primaryLight, colors.background]}
      style={styles.gradientBg}
    >
      <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Upper Logo / Title Area */}
      <Animated.View 
        entering={FadeInUp.delay(200).duration(800)}
        style={styles.headerArea}
      >
        <View style={styles.logoCircle}>
          <Image 
            source={require('../../assets/icon.png')} 
            style={styles.logoImage} 
            resizeMode="cover"
          />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>CycleFlow</Text>
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
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
  },
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
    width: 130,
    height: 130,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.5 }],
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
