import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
      headerTitleAlign: 'center',
      tabBarStyle: { backgroundColor: '#0b1026', borderTopColor: '#1a1f3a' },
      tabBarActiveTintColor: '#fff',
      tabBarInactiveTintColor: '#9aa0c0',
      headerStyle: { backgroundColor: '#0b1026' },
      headerTintColor: '#fff',
    }}>
      <Tabs.Screen
        name="alarms"
        options={{
          title: 'Alarm',
          tabBarIcon: ({ color, size }) => <Ionicons name="alarm" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="trend"
        options={{
          title: 'Sleeping Trend',
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
