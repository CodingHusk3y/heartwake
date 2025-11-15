import AsyncStorage from '@react-native-async-storage/async-storage';

export type RepeatDay = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Sun..Sat
export type Alarm = {
  id: string;
  timeHHMM: string; // '07:30'
  label?: string;
  repeat?: RepeatDay[]; // empty or undefined = one-time
  sound?: string; // identifier
  enabled: boolean;
  notifIds?: string[]; // scheduled notification IDs for cancelation
  smartWake?: boolean; // use smart wake window and staging
  windowMinutes?: number; // minutes before latest time
  nextFireAt?: string; // ISO for one-time alarm next occurrence
};

const KEY = 'heartwake_alarms_v1';

async function read(): Promise<Alarm[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

async function write(list: Alarm[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function listAlarms(): Promise<Alarm[]> {
  const list = await read();
  // sort by time ascending
  return list.sort((a,b) => a.timeHHMM.localeCompare(b.timeHHMM));
}

export async function upsertAlarm(a: Alarm) {
  const list = await read();
  const idx = list.findIndex(x => x.id === a.id);
  if (idx >= 0) list[idx] = a; else list.push(a);
  await write(list);
}

export async function deleteAlarm(id: string) {
  const list = await read();
  await write(list.filter(a => a.id !== id));
}

export async function toggleAlarm(id: string, enabled: boolean) {
  const list = await read();
  const idx = list.findIndex(a => a.id === id);
  if (idx >= 0) {
    list[idx].enabled = enabled;
    await write(list);
  }
}

export function summarizeRepeat(days?: RepeatDay[]) {
  if (!days || days.length === 0) return 'Once';
  const names = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  if (days.length === 7) return 'Every day';
  if (days.length === 5 && !days.includes(0) && !days.includes(6)) return 'Weekdays';
  if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Weekends';
  return days.map(d => names[d]).join(', ');
}
