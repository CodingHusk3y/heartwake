import { Audio, Recording } from 'expo-av';

export type HrSample = { hr: number };

type Subscriber = (s: HrSample) => void;
let subs: Subscriber[] = [];
let recording: Recording | null = null;
let pollTimer: any = null;
let lastBeat = 0;
let smoothedHr: number | undefined;

export async function startClapHr() {
  try {
    await Audio.requestPermissionsAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true, staysActiveInBackground: false });
    const rec = new Recording();
    await rec.prepareToRecordAsync({
      android: {
        extension: '.m4a', outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
        audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC, sampleRate: 44100, numberOfChannels: 1,
        bitRate: 128000,
      },
      ios: {
        extension: '.caf', outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
        audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_LOW,
        sampleRate: 44100, numberOfChannels: 1, bitRate: 128000,
        linearPCMBitDepth: 16, linearPCMIsBigEndian: false, linearPCMIsFloat: false,
      },
      isMeteringEnabled: true,
    } as any);
    await rec.startAsync();
    recording = rec;
    startPolling();
  } catch (e) {
    // ignore; subscribers just won't get data
  }
}

export function subscribeClapHr(cb: Subscriber) {
  subs.push(cb);
  return () => { subs = subs.filter(s => s !== cb); };
}

export function stopClapHr() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
  if (recording) {
    try { recording.stopAndUnloadAsync(); } catch {}
  }
  recording = null;
  lastBeat = 0;
  smoothedHr = undefined;
}

function startPolling() {
  if (!recording) return;
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(async () => {
    if (!recording) return;
    try {
      const status: any = await recording.getStatusAsync();
      // iOS provides metering in dBFS (negative numbers). Android may not.
      const metering = typeof status.metering === 'number' ? status.metering : -160;
      const amp = Math.pow(10, metering / 20); // 0..1 approx
      const threshold = 0.4; // tune for claps
      const now = Date.now();
      if (amp > threshold) {
        if (now - lastBeat > 300) { // min 300ms between beats (~200 bpm)
          if (lastBeat > 0) {
            const bpm = Math.max(40, Math.min(200, 60000 / (now - lastBeat)));
            smoothedHr = smoothedHr === undefined ? bpm : smoothedHr * 0.7 + bpm * 0.3;
            emit({ hr: Math.round(smoothedHr) });
          }
          lastBeat = now;
        }
      }
    } catch {}
  }, 50);
}

function emit(s: HrSample) {
  subs.forEach(fn => fn(s));
}
