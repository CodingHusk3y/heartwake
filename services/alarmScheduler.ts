import * as Notifications from 'expo-notifications';
import { Alert } from 'react-native';
import { Alarm, RepeatDay, listAlarms, upsertAlarm } from './alarmsStore';

export async function ensureNotificationPermission(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    return req.status === 'granted';
  }
  return true;
}

function parseHHMM(hhmm: string): { hour: number; minute: number } {
  const [h, m] = hhmm.split(':').map(Number);
  return { hour: h || 0, minute: m || 0 };
}

function nextOccurrence(hhmm: string): Date {
  const { hour, minute } = parseHHMM(hhmm);
  const d = new Date();
  d.setSeconds(0, 0);
  d.setHours(hour, minute, 0, 0);
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
  return d;
}

function weekdayFromRepeatDay(d: RepeatDay): number {
  // Notifications weekday: 1..7 (1=Sunday)
  return d === 0 ? 1 : d + 1;
}

function hhmmMinusMinutes(hhmm: string, minutes: number): { hh: number; mm: number; dayDelta: number } {
  const { hour, minute } = parseHHMM(hhmm);
  const total = hour * 60 + minute - minutes;
  let dayDelta = 0;
  let mins = total;
  if (mins < 0) { dayDelta = -1; mins = 1440 + mins; }
  const hh = Math.floor(mins / 60) % 24;
  const mm = mins % 60;
  return { hh, mm, dayDelta };
}

export async function cancelForAlarm(alarm: Alarm) {
  if (!alarm.notifIds || alarm.notifIds.length === 0) return;
  await Promise.all(alarm.notifIds.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
}

export async function scheduleForAlarm(alarm: Alarm): Promise<{ ids: string[]; nextFireAt?: string }> {
  await ensureNotificationPermission();
  const { hour, minute } = parseHHMM(alarm.timeHHMM);
  const ids: string[] = [];
  const deadlineContent = { title: alarm.label || 'Alarm', body: alarm.timeHHMM, sound: true as any, data: { alarmId: alarm.id, type: 'deadline' } } as Notifications.NotificationContentInput;
  const windowMins = Math.max(0, alarm.windowMinutes ?? 0);
  const addWindowStartReminder = async (trigger: Notifications.NotificationTriggerInput) => {
    if (!alarm.smartWake || windowMins <= 0) return;
    const id = await Notifications.scheduleNotificationAsync({
      content: { title: 'Smart wake window', body: 'Window started — keep app open for early wake', sound: false as any },
      trigger,
    });
    ids.push(id);
  };
  if (alarm.repeat && alarm.repeat.length > 0) {
    for (const d of alarm.repeat) {
      const id = await Notifications.scheduleNotificationAsync({
        content: deadlineContent,
        trigger: { hour, minute, weekday: weekdayFromRepeatDay(d), repeats: true },
      });
      ids.push(id);
      if (alarm.smartWake && windowMins > 0) {
        const { hh, mm, dayDelta } = hhmmMinusMinutes(alarm.timeHHMM, windowMins);
        let weekday = d;
        if (dayDelta === -1) {
          weekday = ((d + 6) % 7) as RepeatDay; // previous day
        }
        const winId = await Notifications.scheduleNotificationAsync({
          content: { title: 'Smart wake window', body: 'Window started — keep app open for early wake', sound: false as any, data: { alarmId: alarm.id, type: 'window-start' } },
          trigger: { hour: hh, minute: mm, weekday: weekdayFromRepeatDay(weekday), repeats: true },
        });
        ids.push(winId);
      }
    }
  } else {
    const fireDate = nextOccurrence(alarm.timeHHMM);
    const id = await Notifications.scheduleNotificationAsync({ content: deadlineContent, trigger: fireDate });
    ids.push(id);
    if (alarm.smartWake && windowMins > 0) {
      const win = new Date(fireDate);
      win.setMinutes(win.getMinutes() - windowMins);
      const now = new Date();
      if (win.getTime() <= now.getTime()) {
        Alert.alert('Wake window too large', 'Wake window must fall within the remaining time until the alarm. Please reduce the window or set a later alarm.');
      } else {
        try {
          const winId = await Notifications.scheduleNotificationAsync({
            content: { title: 'Smart wake window', body: 'Window started — keep app open for early wake', sound: false as any, data: { alarmId: alarm.id, type: 'window-start' } },
            trigger: win,
          });
          ids.push(winId);
        } catch (e) {
          Alert.alert('Could not schedule window', 'We could not schedule the smart wake window reminder. Adjust your wake window or try again.');
        }
      }
    }
    return { ids, nextFireAt: fireDate.toISOString() };
  }
  return { ids };
}

export async function rescheduleAlarm(alarmId: string) {
  const list = await listAlarms();
  const alarm = list.find((a) => a.id === alarmId);
  if (!alarm) return;
  await cancelForAlarm(alarm);
  if (!alarm.enabled) {
    await upsertAlarm({ ...alarm, notifIds: [] });
    return;
  }
  const result = await scheduleForAlarm(alarm);
  await upsertAlarm({ ...alarm, notifIds: result.ids, nextFireAt: result.nextFireAt });
}
