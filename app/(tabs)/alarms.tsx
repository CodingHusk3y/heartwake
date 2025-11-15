import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useSession } from '../../context/SessionContext';
import { ensureNotificationPermission, rescheduleAlarm } from '../../services/alarmScheduler';
import { Alarm, deleteAlarm, listAlarms, summarizeRepeat, toggleAlarm } from '../../services/alarmsStore';

export default function AlarmsScreen() {
  const router = useRouter();
  const nav = useNavigation();
  const [alarms, setAlarms] = useState<Alarm[]>([]);

  const load = useCallback(() => { listAlarms().then(setAlarms); }, []);
  useEffect(() => { load(); }, [load]);
  useFocusEffect(React.useCallback(() => { cleanupExpiredOneTime().then(load); }, [load]));
  useEffect(() => { ensureNotificationPermission().then(() => {}); }, []);
  useEffect(() => {
    const sub1 = Notifications.addNotificationReceivedListener(async n => {
      const type = (n.request.content.data as any)?.type;
      if (type === 'deadline') { await cleanupExpiredOneTime(); load(); }
    });
    const sub2 = Notifications.addNotificationResponseReceivedListener(async r => {
      const type = (r.notification.request.content.data as any)?.type;
      if (type === 'deadline') { await cleanupExpiredOneTime(); load(); }
    });
    return () => { sub1.remove(); sub2.remove(); };
  }, [load]);

  useEffect(() => {
    nav.setOptions({
      headerRight: () => (
        <Pressable onPress={() => router.push('/alarm/edit')} style={{ paddingHorizontal: 12 }}>
          <Ionicons name="add" size={26} color="#ffffff" />
        </Pressable>
      ),
      headerTitle: 'Alarms',
    });
  }, [nav, router]);

  const renderItem = ({ item }: { item: Alarm }) => <AlarmRow alarm={item} onChanged={load} onPress={() => router.push({ pathname: '/alarm/edit', params: { id: item.id } })} />;

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }}>
      <FlatList
        style={{ backgroundColor: 'transparent' }}
        contentContainerStyle={{ paddingVertical: 8 }}
        data={alarms}
        keyExtractor={(a) => a.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 32, color: '#9aa0c0' }}>No alarms. Tap + to add.</Text>}
        onRefresh={load}
        refreshing={false}
      />
    </View>
  );
}

function AlarmRow({ alarm, onChanged, onPress }: { alarm: Alarm; onChanged: () => void; onPress: () => void }) {
  const ref = useRef<Swipeable | null>(null);
  const { setConfig, updateState } = useSession();
  const router = useRouter();
  function computeNextTargetISO(a: Alarm): string {
    const [hh, mm] = a.timeHHMM.split(':').map(Number);
    const now = new Date();
    const base = new Date();
    base.setSeconds(0,0);
    if (a.repeat && a.repeat.length > 0) {
      // find next repeated day >= today
      const today = now.getDay(); // 0..6
      for (let offset = 0; offset < 7; offset++) {
        const day = (today + offset) % 7 as any;
        if (a.repeat!.includes(day)) {
          const d = new Date(now);
          d.setDate(now.getDate() + offset);
          d.setHours(hh, mm, 0, 0);
          if (d.getTime() <= now.getTime()) continue; // skip past time today
          return d.toISOString();
        }
      }
      // fallback one week later same first repeat
      const d = new Date(now);
      d.setDate(now.getDate() + 7);
      d.setHours(hh, mm, 0, 0);
      return d.toISOString();
    } else {
      const d = new Date();
      d.setHours(hh, mm, 0, 0);
      if (d.getTime() <= now.getTime()) d.setDate(d.getDate() + 1);
      return d.toISOString();
    }
  }
  function startSleep() {
    const targetTime = computeNextTargetISO(alarm);
    const windowMinutes = alarm.windowMinutes ?? 30;
    setConfig({ targetTime, windowMinutes });
    updateState({ active: true, startedAt: new Date().toISOString() });
    router.push('/sleep/live');
  }
  const rightActions = () => (
    <View style={{ flexDirection: 'row' }}>
      <Pressable style={styles.start} onPress={() => { ref.current?.close(); startSleep(); }}>
        <Ionicons name="moon" size={20} color="#fff" />
        <Text style={{ color: '#fff', marginLeft: 6 }}>Start</Text>
      </Pressable>
      <Pressable style={styles.delete} onPress={async () => { await deleteAlarm(alarm.id); await rescheduleAlarm(alarm.id); ref.current?.close(); onChanged(); }}>
        <Ionicons name="trash" size={22} color="#fff" />
        <Text style={{ color: '#fff', marginLeft: 6 }}>Delete</Text>
      </Pressable>
    </View>
  );
  return (
    <Swipeable ref={ref} renderRightActions={rightActions} overshootRight={false}>
      <Pressable onPress={onPress} style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.time}>{alarm.timeHHMM}</Text>
          <Text style={styles.meta}>
            {(alarm.label || 'Alarm')} · {summarizeRepeat(alarm.repeat)}{alarm.smartWake ? ` · Smart wake ${alarm.windowMinutes ?? 30}m` : ''}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable
            accessibilityRole="button"
            onPress={(e) => { e.stopPropagation(); startSleep(); }}
            style={styles.startPill}
          >
            <Ionicons name="moon" size={16} color="#fff" />
            <Text style={{ color: '#fff', marginLeft: 6 }}>Start</Text>
          </Pressable>
          <Switch value={alarm.enabled} onValueChange={async (v) => { await toggleAlarm(alarm.id, v); await rescheduleAlarm(alarm.id); onChanged(); }} />
        </View>
      </Pressable>
    </Swipeable>
  );
}

async function cleanupExpiredOneTime() {
  const list = await listAlarms();
  const now = Date.now();
  const expired = list.filter(a => (!a.repeat || a.repeat.length === 0) && !!a.nextFireAt && new Date(a.nextFireAt).getTime() < now - 60 * 1000);
  for (const a of expired) {
    await deleteAlarm(a.id);
  }
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#1a1f3a' },
  time: { fontSize: 28, fontWeight: '600', color: '#ffffff' },
  meta: { color: '#9aa0c0', marginTop: 2 },
  delete: { backgroundColor: '#e24a4a', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, flexDirection: 'row' },
  start: { backgroundColor: '#4a90e2', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, flexDirection: 'row' },
  startPill: { backgroundColor: '#4a90e2', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 14, flexDirection: 'row', alignItems: 'center' },
});
