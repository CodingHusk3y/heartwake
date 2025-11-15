import AsyncStorage from '@react-native-async-storage/async-storage';
import { SleepSessionConfig } from '../context/SessionContext';

const KEY = 'heartwake_sessions_v1';

export type StoredSession = {
  id: string;
  targetTime: string;
  wakeTime?: string;
  early: boolean; // true if early wake inside window
  windowMinutes: number;
  rating?: number; // user wake quality 1-5
  minutesEarly?: number; // minutes between early wake and target
};

async function read(): Promise<StoredSession[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

async function write(sessions: StoredSession[]) { await AsyncStorage.setItem(KEY, JSON.stringify(sessions)); }

export async function saveSession(cfg: SleepSessionConfig, wakeTime: string | undefined, early: boolean, minutesEarly?: number) {
  const sessions = await read();
  sessions.unshift({ id: String(Date.now()), targetTime: cfg.targetTime, wakeTime, early, windowMinutes: cfg.windowMinutes, minutesEarly });
  await write(sessions.slice(0, 100));
}

export async function listSessions(): Promise<StoredSession[]> { return read(); }

export async function rateSession(id: string, rating: number) {
  const sessions = await read();
  const idx = sessions.findIndex(s => s.id === id);
  if (idx >= 0) {
    sessions[idx].rating = rating;
    await write(sessions);
  }
}
