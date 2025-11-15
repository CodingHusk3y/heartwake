import React, { useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { TrendChart } from '../../components/TrendChart';
import { listSessions, StoredSession } from '../../services/storage';

export default function TrendScreen() {
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  useEffect(() => { listSessions().then(setSessions); }, []);
  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: 'transparent' }}>
      <TrendChart sessions={sessions} />
      <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 8, color: '#ffffff' }}>Recent Sessions</Text>
      <FlatList
        style={{ backgroundColor: 'transparent' }}
        data={sessions}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => (
          <View style={{ paddingVertical: 8 }}>
            <Text style={{ color: '#ffffff' }}>{new Date(item.targetTime).toLocaleString()} → {item.wakeTime ? new Date(item.wakeTime).toLocaleTimeString() : '—'}</Text>
            <Text style={{ color: '#9aa0c0' }}>
              {item.early ? `Early wake${typeof item.minutesEarly === 'number' ? ` · ${item.minutesEarly} min early` : ''}` : 'Deadline wake'}
              {item.rating !== undefined ? ` · Rating ${item.rating}` : ''}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: '#9aa0c0' }}>No sessions yet.</Text>}
      />
    </View>
  );
}
