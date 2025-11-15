import * as Notifications from 'expo-notifications';
import { deleteAlarm, listAlarms } from './alarmsStore';

let initialized = false;

export function initializeNotifications() {
  if (initialized) return;
  initialized = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false })
  });

  // Foreground receipt
  Notifications.addNotificationReceivedListener(async (notification) => {
    try { await handleNotificationEvent(notification); } catch {}
  });
  // Background response (user taps)
  Notifications.addNotificationResponseReceivedListener(async (response) => {
    try { await handleNotificationEvent(response.notification); } catch {}
  });
}

async function handleNotificationEvent(notification: Notifications.Notification) {
  const data = (notification.request.content?.data || {}) as any;
  const type = data?.type;
  const alarmId = data?.alarmId as string | undefined;
  if (!alarmId) return;
  if (type === 'deadline') {
    const list = await listAlarms();
    const alarm = list.find(a => a.id === alarmId);
    if (alarm && (!alarm.repeat || alarm.repeat.length === 0)) {
      // One-time alarm: remove after firing
      await deleteAlarm(alarmId);
    }
  }
}
