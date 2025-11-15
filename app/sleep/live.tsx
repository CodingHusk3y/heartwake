import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Switch, Text, View } from 'react-native';
import LiveHrChart from '../../components/LiveHrChart';
import NumberWheel from '../../components/NumberWheel';
import { useSession } from '../../context/SessionContext';
import { startWakeMonitoring, stopWakeMonitoring, updateStageForAlarm } from '../../services/alarm';
import { getClapSensitivity, setClapSensitivity, startClapHr, stopClapHr, subscribeClapHr } from '../../services/clapHr';
import { startHeartRateMock, stopHeartRateMock, subscribeHeartRate } from '../../services/heartRateMock';
import { startMotion, stopMotion, subscribeMotion } from '../../services/sensors';
import { inferStage } from '../../services/staging';

export default function LiveSession() {
  const { config, state, updateState, reset } = useSession();
  const router = useRouter();
  const [hr, setHr] = useState<number | undefined>();
  const [motionMag, setMotionMag] = useState<number | undefined>();
  const [stage, setStage] = useState<string>('unknown');
  const [hrSeries, setHrSeries] = useState<number[]>([]);
  const hrRef = useRef<number | undefined>(undefined);
  const motionRef = useRef<number | undefined>(undefined);
  const [useClap, setUseClap] = useState<boolean>(true);
  const [sensitivity, setSensitivity] = useState<number>(getClapSensitivity?.() ?? 3);

  useEffect(() => {
    if (!config) return;
    if (useClap) {
      startClapHr();
    } else {
      startHeartRateMock();
    }
    (async () => {
      if (useClap) {
        const ok = await startClapHr();
        if (!ok) {
          Alert.alert('Microphone unavailable', 'Clap mode needs the microphone permission and expo-av package. Falling back to mock HR.');
          setUseClap(false);
          startHeartRateMock();
        }
      } else {
        startHeartRateMock();
      }
    })();
    startMotion();
    const hrUnsub = (useClap ? subscribeClapHr : subscribeHeartRate)((sample: any) => {
      hrRef.current = sample.hr;
      setHr(sample.hr);
      setHrSeries(prev => {
        const next = [...prev, sample.hr];
        // keep last 60 points
        if (next.length > 60) next.shift();
        return next;
      });
      updateStage(hrRef.current, motionRef.current);
    });
    const motionUnsub = subscribeMotion(mag => {
      motionRef.current = mag;
      setMotionMag(mag);
      updateStage(hrRef.current, motionRef.current);
    });
    startWakeMonitoring(config, (info) => {
      updateState({ earlyWakeTriggered: info.early, wakeTime: info.wakeTime, stage: info.stage });
      // navigate to rating screen automatically
      router.push('/sleep/rate');
    });
    return () => {
      hrUnsub();
      motionUnsub();
      if (useClap) stopClapHr(); else stopHeartRateMock();
      stopMotion();
      stopWakeMonitoring();
    };
  }, [config, useClap]);

  function updateStage(hrVal?: number, motion?: number) {
    if (hrVal === undefined || motion === undefined) return;
    const s = inferStage({ hr: hrVal, movementMagnitude: motion });
    setStage(s);
    updateState({ stage: s });
    updateStageForAlarm(s);
  }

  if (!config) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }}><Text style={{ color: '#ffffff' }}>No config.</Text></View>;

  return (
    <View style={{ flex: 1, padding: 16, gap: 12, backgroundColor: 'transparent' }}>
      <Text style={{ fontSize: 20, fontWeight: '600', color: '#ffffff' }}>Current Alarms</Text>
      <Text style={{ color: '#ffffff' }}>Target: {new Date(config.targetTime).toLocaleTimeString()} window {config.windowMinutes}m</Text>
      <Text style={{ color: '#ffffff' }}>Heart Rate: {hr ? hr.toFixed(0) : '—'} bpm</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ color: '#9aa0c0' }}>Clap mode</Text>
        <Switch value={useClap} onValueChange={setUseClap} />
      </View>
      {useClap && (
        <View style={{ marginTop: 4 }}>
          <Text style={{ color: '#9aa0c0', marginBottom: 6 }}>Sensitivity (x{sensitivity})</Text>
          <NumberWheel
            value={sensitivity}
            onChange={(v) => { setSensitivity(v); setClapSensitivity(v); }}
            min={2}
            max={6}
            step={1}
            labelSuffix="x"
          />
        </View>
      )}
      <LiveHrChart data={hrSeries} />
      <Text style={{ color: '#ffffff' }}>Motion Magnitude: {motionMag ? motionMag.toFixed(2) : '—'}</Text>
      <Text style={{ color: '#ffffff' }}>Stage: {stage}</Text>
      {state.earlyWakeTriggered && <Text style={{ color: '#4a90e2' }}>Early wake alarm fired.</Text>}
      <Button title="Stop Session" onPress={() => { reset(); router.push('/'); }} />
    </View>
  );
}
