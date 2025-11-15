import { Picker } from '@react-native-picker/picker';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type TimeWheelValue = {
  hour12: number; // 1..12
  minute: number; // 0..59
  ampm: 'AM' | 'PM';
};

export function to24hString(v: TimeWheelValue): string {
  let h = v.hour12 % 12;
  if (v.ampm === 'PM') h += 12;
  return `${String(h).padStart(2,'0')}:${String(v.minute).padStart(2,'0')}`;
}

export function from24hString(hhmm: string): TimeWheelValue {
  const [hStr, mStr] = hhmm.split(':');
  let h = parseInt(hStr, 10);
  const minute = parseInt(mStr, 10) || 0;
  const ampm: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return { hour12: h, minute, ampm };
}

export default function TimeWheel({ value, onChange }: { value: string; onChange: (newHHMM: string) => void }) {
  const initial = useMemo(() => from24hString(value || '07:00'), [value]);
  const [hour12, setHour12] = useState<number>(initial.hour12);
  const [minute, setMinute] = useState<number>(initial.minute);
  const [ampm, setAmpm] = useState<'AM' | 'PM'>(initial.ampm);

  useEffect(() => {
    onChange(to24hString({ hour12, minute, ampm }));
  }, [hour12, minute, ampm]);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <View style={styles.container}>
      <Picker style={styles.picker} selectedValue={hour12} onValueChange={(v: number) => setHour12(v)}>
        {hours.map(h => <Picker.Item key={h} label={String(h)} value={h} />)}
      </Picker>
      <Text style={styles.colon}>:</Text>
      <Picker style={styles.picker} selectedValue={minute} onValueChange={(v: number) => setMinute(v)}>
        {minutes.map(m => <Picker.Item key={m} label={String(m).padStart(2,'0')} value={m} />)}
      </Picker>
      <Picker style={[styles.picker, { width: 110 }]} selectedValue={ampm} onValueChange={(v: 'AM' | 'PM') => setAmpm(v)}>
        <Picker.Item label="AM" value="AM" />
        <Picker.Item label="PM" value="PM" />
      </Picker>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  picker: { width: 100 },
  colon: { fontSize: 24, fontWeight: '600' },
});
