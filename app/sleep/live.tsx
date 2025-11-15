import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Button, Text, View } from 'react-native';
import { useSession } from '../../context/SessionContext';
import { startWakeMonitoring, stopWakeMonitoring, updateStageForAlarm } from '../../services/alarm';
import { startHeartRateMock, stopHeartRateMock, subscribeHeartRate } from '../../services/heartRateMock';
import { startMotion, stopMotion, subscribeMotion } from '../../services/sensors';
import { inferStage } from '../../services/staging';

export default function LiveSession() {
  const { config, state, updateState, reset } = useSession();
  const router = useRouter();
  const [hr, setHr] = useState<number | undefined>();
  const [motionMag, setMotionMag] = useState<number | undefined>();
  const [stage, setStage] = useState<string>('unknown');

  useEffect(() => {
    if (!config) return;
    startHeartRateMock();
    startMotion();
    const hrUnsub = subscribeHeartRate(sample => {
      setHr(sample.hr);
      updateStage(sample.hr, motionMag);
    });
    const motionUnsub = subscribeMotion(mag => {
      setMotionMag(mag);
      updateStage(hr, mag);
    });
    startWakeMonitoring(config, (info) => {
      updateState({ earlyWakeTriggered: info.early, wakeTime: info.wakeTime, stage: info.stage });
      // navigate to rating screen automatically
      router.push('/sleep/rate');
    });
    return () => {
      hrUnsub();
      motionUnsub();
      stopHeartRateMock();
      stopMotion();
      stopWakeMonitoring();
    };
  }, [config]);

  function updateStage(hrVal?: number, motion?: number) {
    if (hrVal === undefined || motion === undefined) return;
    const s = inferStage({ hr: hrVal, movementMagnitude: motion });
    setStage(s);
    updateState({ stage: s });
    updateStageForAlarm(s);
  }

  if (!config) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>No config.</Text></View>;

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>Current Alarms</Text>
      <Text>Target: {new Date(config.targetTime).toLocaleTimeString()} window {config.windowMinutes}m</Text>
      <Text>Heart Rate: {hr ? hr.toFixed(0) : '—'} bpm</Text>
      <Text>Motion Magnitude: {motionMag ? motionMag.toFixed(2) : '—'}</Text>
      <Text>Stage: {stage}</Text>
      {state.earlyWakeTriggered && <Text>Early wake alarm fired.</Text>}
      <Button title="Stop Session" onPress={() => { reset(); router.push('/'); }} />
    </View>
  );
}
