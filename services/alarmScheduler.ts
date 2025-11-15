import * as Notifications from 'expo-notifications';
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

export async function scheduleForAlarm(alarm: Alarm): Promise<string[]> {
  await ensureNotificationPermission();
  const { hour, minute } = parseHHMM(alarm.timeHHMM);
  const ids: string[] = [];
  const content = { title: alarm.label || 'Alarm', body: alarm.timeHHMM, sound: true as any };
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
        content,
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
          content: { title: 'Smart wake window', body: 'Window started — keep app open for early wake', sound: false as any },
          trigger: { hour: hh, minute: mm, weekday: weekdayFromRepeatDay(weekday), repeats: true },
        });
        ids.push(winId);
      }
    }
  } else {
    const fireDate = nextOccurrence(alarm.timeHHMM);
    const id = await Notifications.scheduleNotificationAsync({ content, trigger: fireDate });
    ids.push(id);
    if (alarm.smartWake && windowMins > 0) {
      const win = new Date(fireDate);
      win.setMinutes(win.getMinutes() - windowMins);
      const winId = await Notifications.scheduleNotificationAsync({
        content: { title: 'Smart wake window', body: 'Window started — keep app open for early wake', sound: false as any },
        trigger: win,
      });
      ids.push(winId);
    }
  }
  return ids;
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
  const ids = await scheduleForAlarm(alarm);
  await upsertAlarm({ ...alarm, notifIds: ids });
}
