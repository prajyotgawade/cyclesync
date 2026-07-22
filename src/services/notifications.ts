import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Set default notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  } as any),
});

/**
 * Requests permissions for local notifications.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

/**
 * Cancels all currently scheduled reminders.
 */
export async function cancelAllReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Schedules a daily reminder to log the day.
 */
export async function scheduleDailyLogReminder(hour: number = 20, minute: number = 0) {
  if (Platform.OS === 'web') return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to sync! 🌸',
      body: 'Take 10 seconds to log today’s symptoms and mood in CycleSync.',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

/**
 * Schedules a daily reminder for birth control pills.
 */
export async function scheduleBirthControlReminder(timeStr: string) {
  if (Platform.OS === 'web') return;

  const [hourStr, minStr] = timeStr.split(':');
  const hour = parseInt(hourStr, 10) || 21;
  const minute = parseInt(minStr, 10) || 0;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Pill Reminder 💊',
      body: 'It’s time to take your birth control pill. Tap to log!',
      sound: true,
      data: { type: 'birth_control' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

/**
 * Schedules upcoming period warning notifications.
 */
export async function scheduleUpcomingPeriodReminder(predictedStartDate: string, daysBefore: number = 2) {
  if (Platform.OS === 'web') return;

  const targetDate = new Date(predictedStartDate);
  targetDate.setDate(targetDate.getDate() - daysBefore);
  targetDate.setHours(9, 0, 0, 0); // 9:00 AM local time

  // Only schedule if the date is in the future
  if (targetDate.getTime() > Date.now()) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Upcoming Period 🌸',
        body: `Your period is predicted to start in ${daysBefore} days. Stay prepared!`,
        sound: true,
      },
      trigger: { date: targetDate } as any,
    });
  }
}

/**
 * Schedules upcoming ovulation window notifications.
 */
export async function scheduleOvulationReminder(ovulationDate: string) {
  if (Platform.OS === 'web') return;

  const targetDate = new Date(ovulationDate);
  targetDate.setDate(targetDate.getDate() - 1); // 1 day before ovulation
  targetDate.setHours(10, 0, 0, 0); // 10:00 AM

  if (targetDate.getTime() > Date.now()) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Fertile Window 👶',
        body: 'Your high-fertility window is peaking tomorrow. Tap to view details.',
        sound: true,
      },
      trigger: { date: targetDate } as any,
    });
  }
}

