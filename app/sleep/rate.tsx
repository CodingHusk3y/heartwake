import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Button, Pressable, Text, View } from 'react-native';
import { listSessions, rateSession, StoredSession } from '../../services/storage';

export default function RateWake() {
  const router = useRouter();
  const [session, setSession] = useState<StoredSession | undefined>();
  useEffect(() => {
    listSessions().then(s => {
      const first = s[0];
      if (first && first.rating === undefined) setSession(first);
    });
  }, []);

  async function rate(value: number) {
    if (session) {
      await rateSession(session.id, value);
      router.push('/');
    } else {
      router.push('/');
    }
  }
  function StarRow({ value, onSelect }: { value: number; onSelect: (v: number) => void }) {
    return (
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[1,2,3,4,5].map(v => (
          <Pressable key={v} onPress={() => onSelect(v)}>
            <Ionicons name={v <= value ? 'star' : 'star-outline'} size={32} color={v <= value ? '#ffd166' : '#9aa0c0'} />
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 16, backgroundColor: 'transparent' }}>
      <Text style={{ fontSize: 20, fontWeight: '600', color: '#ffffff' }}>Wake Quality Rating</Text>
      {session ? (
        <>
          <Text style={{ color: '#ffffff' }}>Wake Time: {session.wakeTime ? new Date(session.wakeTime).toLocaleTimeString() : '—'}</Text>
          <Text style={{ color: '#ffffff' }}>Early Wake: {session.early ? `Yes${typeof session.minutesEarly === 'number' ? ` · ${session.minutesEarly} min early` : ''}` : 'No'}</Text>
          <Text style={{ color: '#9aa0c0' }}>Tap stars to rate:</Text>
          <StarRow value={0} onSelect={(v) => rate(v)} />
        </>
      ) : (
        <Text style={{ color: '#9aa0c0' }}>No unrated session found.</Text>
      )}
      <Button title="Skip" onPress={() => router.push('/')} />
    </View>
  );
}
