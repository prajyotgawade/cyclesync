import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StyleSheet, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNavigator } from './src/navigation/AppNavigator';
import * as SplashScreen from 'expo-splash-screen';
import { useCycleStore } from './src/store/useCycleStore';

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  '`expo-notifications` functionality is not fully supported',
]);

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const isInitialized = useCycleStore(state => state.isInitialized);

  useEffect(() => {
    if (isInitialized) {
      // Hide the native splash screen once the app is fully initialized and ready to render
      setTimeout(() => {
         SplashScreen.hideAsync();
      }, 100);
    }
  }, [isInitialized]);
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
