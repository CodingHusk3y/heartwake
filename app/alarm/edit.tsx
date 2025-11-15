import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Button, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import NumberWheel from '../../components/NumberWheel';
import TimeWheel from '../../components/TimeWheel';
import { rescheduleAlarm } from '../../services/alarmScheduler';
import { Alarm, RepeatDay, listAlarms, upsertAlarm } from '../../services/alarmsStore';

function pad(n: number) { return n.toString().padStart(2, '0'); }
function newId() { return String(Date.now()); }

export default function EditAlarm() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const nav = useNavigation();
  const [time, setTime] = useState('07:00');
  const [label, setLabel] = useState('Alarm');
  const [repeat, setRepeat] = useState<RepeatDay[]>([]);
  const [sound, setSound] = useState('default');
  const [smartWake, setSmartWake] = useState<boolean>(true);
  const [windowMinutes, setWindowMinutes] = useState<number>(30);

  useEffect(() => {
    if (id) {
      listAlarms().then(list => {
        const a = list.find(x => x.id === id);
        if (a) {
          setTime(a.timeHHMM); setLabel(a.label || 'Alarm'); setRepeat(a.repeat || []); setSound(a.sound || 'default');
          setSmartWake(a.smartWake ?? true);
          setWindowMinutes(a.windowMinutes ?? 30);
        }
      });
    }
  }, [id]);

  useLayoutEffect(() => {
    nav.setOptions({ title: id ? 'Edit Alarm' : 'Add Alarm' });
  }, [nav, id]);

  const toggleDay = (d: RepeatDay) => {
    setRepeat(r => r.includes(d) ? r.filter(x => x !== d) : [...r, d].sort());
  };

  const save = async () => {
    const wm = Math.max(0, Math.min(180, Number.isFinite(windowMinutes) ? windowMinutes : 30));
    const alarm: Alarm = { id: id || newId(), timeHHMM: time, label, repeat, sound, enabled: true, smartWake, windowMinutes: wm };
    await upsertAlarm(alarm);
    await rescheduleAlarm(alarm.id);
    router.back();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: 'transparent' }}
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator
    >
      <Text style={{ fontSize: 16, color: '#ffffff' }}>Time</Text>
      <TimeWheel value={time} onChange={setTime} />
      <Text style={{ color: '#ffffff' }}>Label</Text>
      <TextInput value={label} onChangeText={setLabel} style={{ borderWidth: 1, padding: 10, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderColor: '#1a1f3a', color: '#ffffff' }} />
      <Text style={{ color: '#ffffff' }}>Repeat</Text>
      <WeekdayPicker value={repeat} onChange={setRepeat} />
      <Text style={{ color: '#ffffff' }}>Sound</Text>
      <TextInput value={sound} onChangeText={setSound} style={{ borderWidth: 1, padding: 10, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)', borderColor: '#1a1f3a', color: '#ffffff' }} placeholder="default" placeholderTextColor="#9aa0c0" />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ color: '#ffffff' }}>Smart Wake</Text>
        <Switch value={smartWake} onValueChange={setSmartWake} />
      </View>
      <Text style={{ color: '#ffffff' }}>Wake Window</Text>
      <NumberWheel value={windowMinutes} onChange={setWindowMinutes} min={0} max={120} step={5} />
      <Button title={id ? 'Save' : 'Add'} onPress={save} />
      <View style={{ height: 8 }} />
    </ScrollView>
  );
}

function WeekdayPicker({ value, onChange }: { value: RepeatDay[]; onChange: (v: RepeatDay[]) => void }) {
  const days: { d: RepeatDay; label: string }[] = [
    { d: 0, label: 'Sun' }, { d: 1, label: 'Mon' }, { d: 2, label: 'Tue' }, { d: 3, label: 'Wed' }, { d: 4, label: 'Thu' }, { d: 5, label: 'Fri' }, { d: 6, label: 'Sat' },
  ];
  return (
    <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
      {days.map(({ d, label }) => {
        const selected = value.includes(d);
        return (
          <Pressable key={d} onPress={() => onChange(selected ? value.filter(x => x !== d) : [...value, d])} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: selected ? '#4a90e2' : '#1a1f3a', backgroundColor: selected ? 'rgba(74,144,226,0.2)' : 'rgba(255,255,255,0.06)' }}>
            <Text style={{ color: selected ? '#4a90e2' : '#ffffff' }}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
