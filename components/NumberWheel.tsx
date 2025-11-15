import { Picker } from '@react-native-picker/picker';
import React from 'react';
import { View } from 'react-native';

export default function NumberWheel({
  value,
  onChange,
  min = 0,
  max = 120,
  step = 5,
  width = 120,
  labelSuffix = 'm',
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  width?: number;
  labelSuffix?: string;
}) {
  const options: number[] = [];
  for (let n = min; n <= max; n += step) options.push(n);
  return (
    <View style={{ width }}>
      <Picker
        selectedValue={value}
        onValueChange={(v: number) => onChange(v)}
        style={{ color: '#ffffff', backgroundColor: 'transparent' }}
        itemStyle={{ color: '#ffffff' }}
      >
        {options.map((n) => (
          <Picker.Item key={n} label={`${n}${labelSuffix}`} value={n} />
        ))}
      </Picker>
    </View>
  );
}
