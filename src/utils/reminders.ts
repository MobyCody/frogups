import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import { getStreak, type ReminderTime } from '@/utils/workout';

const CHANNEL_ID = 'training-reminders';

type NotificationsModule = typeof import('expo-notifications');

// Android Expo Go throws when expo-notifications is imported, so load it only in a development build
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
let cached: NotificationsModule | null = null;

function getNotifications(): NotificationsModule | null {
  if (isExpoGo) {
    return null;
  }

  if (!cached) {
    cached = require('expo-notifications') as NotificationsModule;
    cached.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }

  return cached;
}

async function hasPermission(Notifications: NotificationsModule, askIfNeeded: boolean): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();

  if (current.granted) {
    return true;
  }

  if (!askIfNeeded || !current.canAskAgain) {
    return false;
  }

  return (await Notifications.requestPermissionsAsync()).granted;
}

export async function cancelReminders(): Promise<void> {
  try {
    await getNotifications()?.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Failed to cancel reminders:', error);
  }
}

export interface ReminderSettings {
  trainingDays: number[];
  reminderTime: ReminderTime;
  completedAt: string[];
  frozenDays: string[];
}

const STREAK_ALERT_HOUR = 21;
const STREAK_ALERT_DAYS_AHEAD = 14;

// Replaces all scheduled reminders: a weekly reminder per training day, plus one-off 21:00 streak
// alerts for upcoming training days. The alerts are one-off so a finished session can skip today's;
// they are rebuilt whenever settings change, a session is saved, or the app opens.
// trainingDays use 0 = Monday … 6 = Sunday.
export async function syncReminders(settings: ReminderSettings, askForPermission: boolean): Promise<void> {
  const { trainingDays, reminderTime: time, completedAt, frozenDays } = settings;

  try {
    const Notifications = getNotifications();

    if (!Notifications) {
      return;
    }

    if (Platform.OS === 'android') {
      // Channel must exist before the Android 13+ permission prompt can appear
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Training reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!(await hasPermission(Notifications, askForPermission))) {
      return;
    }

    await Promise.all(
      trainingDays.map((day) =>
        Notifications.scheduleNotificationAsync({
          content: {
            title: 'Time for your pushups 🐸',
            body: 'Today is a training day. Ready to get frogged?',
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            // expo-notifications weekdays run 1 = Sunday … 7 = Saturday
            weekday: ((day + 1) % 7) + 1,
            hour: time.hour,
            minute: time.minute,
            channelId: CHANNEL_ID,
          },
        }),
      ),
    );

    const now = new Date();
    const { current, doneToday } = getStreak(completedAt, trainingDays, now, frozenDays);

    // Nothing to save without a streak
    if (current === 0) {
      return;
    }

    const alerts: Promise<string>[] = [];

    for (let offset = 0; offset < STREAK_ALERT_DAYS_AHEAD; offset += 1) {
      const fireAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, STREAK_ALERT_HOUR);
      const isTrainingDay = trainingDays.includes((fireAt.getDay() + 6) % 7);

      if (!isTrainingDay || fireAt <= now || (offset === 0 && doneToday)) {
        continue;
      }

      alerts.push(
        Notifications.scheduleNotificationAsync({
          content: {
            title: `Save your ${current}-day streak 💦`,
            body: 'You haven’t trained yet today. A quick workout keeps your streak alive!',
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: fireAt,
            channelId: CHANNEL_ID,
          },
        }),
      );
    }

    await Promise.all(alerts);
  } catch (error) {
    console.error('Failed to sync reminders:', error);
  }
}
