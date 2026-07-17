import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Navigation types
import { RootStackParamList, AuthStackParamList, AppTabParamList } from './NavigationTypes';

// Screens
import { SplashScreen } from '../screens/SplashScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { LogScreen } from '../screens/LogScreen';
import { InsightsScreen } from '../screens/InsightsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

// Hooks & Theme
import { useTheme } from '../hooks/useTheme';
import { formatLocalDate } from '../utils/predictions';

const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<AppTabParamList>();

// --- Auth Stack Navigator ---
export const AuthNavigator = () => {
  return (
    <AuthStack.Navigator 
      screenOptions={{ 
        headerShown: false, 
        cardStyle: { backgroundColor: 'transparent' },
        ...TransitionPresets.SlideFromRightIOS,
      }}
    >
      <AuthStack.Screen name="Welcome" component={AuthScreen} />
      <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
    </AuthStack.Navigator>
  );
};

// --- Custom Centered Tab Button ---
const CustomTabBarButton = ({ children, onPress }: any) => {
  const { brandColors } = useTheme();
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      style={styles.customTabButtonContainer}
    >
      <View style={[styles.customTabButton, { backgroundColor: brandColors.primaryDark }]}>
        <Ionicons name="add" size={32} color="#FFF" />
      </View>
    </Pressable>
  );
};

// --- Bottom Tab Navigator ---
export const TabNavigator = () => {
  const { colors, brandColors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: brandColors.primaryDark,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Today',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'heart' : 'heart-outline'} size={focused ? 24 : 22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="CalendarTab"
        component={CalendarScreen}
        options={{
          tabBarLabel: 'Calendar',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={focused ? 24 : 22} color={color} />
          ),
        }}
      />
      
      {/* Centered Quick-Log Intercept */}
      <Tab.Screen
        name="LogPlaceholder"
        component={LogScreen} // required by React Navigation definition, but we intercept click
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault(); // Stop navigation to page
            (navigation as any).navigate('LogModal', { date: formatLocalDate(new Date()) });
          },
        })}
        options={{
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
        }}
      />

      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{
          tabBarLabel: 'Insights',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'analytics' : 'analytics-outline'} size={focused ? 24 : 22} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={focused ? 24 : 22} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// --- App Root Navigation Container ---
export const AppNavigator = () => {
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Splash" component={SplashScreen} />
        <RootStack.Screen name="AuthNavigator" component={AuthNavigator} />
        <RootStack.Screen name="AppNavigator" component={TabNavigator} />
        <RootStack.Screen
          name="LogModal"
          component={LogScreen}
          options={{
            presentation: 'transparentModal',
            ...TransitionPresets.ModalPresentationIOS,
            cardOverlayEnabled: true,
            gestureEnabled: true,
          }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  customTabButtonContainer: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: 60,
  },
  customTabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7C4DFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
});
