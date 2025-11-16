# Heartwake

<img width="1024" height="1024" alt="ChatGPT Image Nov 16, 2025, 03_14_02 AM" src="https://github.com/user-attachments/assets/6271f182-416b-416f-abc9-79dc73ca70bb" />

A dark, sleep‑friendly smart alarm that aims to wake you during lighter sleep—trading a few minutes of time for less grogginess.

## Inspiration
Waking at the same time can still feel rough if you emerge from deep (N3) sleep. Light stages (late N2 / post‑REM) reduce sleep inertia. Heartwake explores simple, privacy‑first heuristics to pick a better wake moment without requiring a wearable.

## What it does
- iPhone‑style alarm list (add, edit, repeat days, label, sound, one‑time or repeating).
- Smart Wake window (0–60 min) tries to fire early during a light stage; fallback at deadline.
- Live session (Current Alarms): heart rate line chart, clap‑based HR demo, adaptive sensitivity slider, stage estimate, minutes‑early display.
- Sleeping Trend: horizontally scrollable duration bar chart (0–10h axis) + compact recent sessions list.
- Starry dark theme designed for night use.
- Inline validation (wake window vs remaining time), immediate one‑time alarm cleanup.

## How we built it
- Expo (Router Tabs + Stack), React Native, AsyncStorage for alarms/sessions.
- Notifications via `expo-notifications` (deadline + window start reminder).
- Sensors: accelerometer (expo-sensors); microphone (expo-audio / fallback expo-av) for clap HR.
- Sleep staging heuristic: fast/slow HR EMAs + motion magnitude (no medical claims).
- Charts: `react-native-svg` (live HR line w/ tip marker, duration bar chart).
- Smart wake monitoring runs foreground (Expo constraint) after user taps Start.

## Challenges we ran into
- Foreground requirement for continuous stage inference.
- Microphone permission and SDK transition (expo-av deprecated → expo-audio).
- Preventing past-time notification triggers (validation before scheduling).
- Reliable removal of one‑time alarms after firing.
- Making clap detection resilient to diverse ambient noise (adaptive baseline + sensitivity).

## Accomplishments that we're proud of
- Seamless alarm UX with immediate “Start sleep” and adjustable wake window.
- Real‑time HR visualization and interactive clap HR demo.
- Clean, scrollable trend chart emphasizing sleep duration over clutter.
- Defensive UX: warnings, fallbacks, capability detection, dark consistency.

## What we learned
- Lightweight heuristics can approximate “better wake” logic without full polysomnography.
- HR trend + motion are noisy; adaptive thresholds outperform static ones.
- Capability gating avoids broken features (web mic, missing modules).
- Small UI refinements (Back label, centered wheels, star rating) improve clarity.

## What's next for Heartwake
- Native health integrations (Apple Watch / HealthKit, Android Health Connect, BLE HR straps).
- On‑device ML (tfjs/ONNX) for stage classification + personalization from user ratings.
- Dynamic window auto‑tuning based on historical early vs deadline outcomes.
- Weekly consistency insights, bedtime recommendations, anomaly alerts (illness / sleep debt).
- Optional encrypted sync, data export & deletion; maintain local‑first default.
- Replace clap demo with real sensor pipeline in background (requires Bare / Dev Client).

## Installation
```bash
git clone <repo-url>
cd heartwake
npm install
npx expo start
```

## Scripts
- `npx expo start` – run dev client / web.
- `npx tsc --noEmit` – type check.
- `npx expo-doctor` – environment diagnostics.

## Project Structure (simplified)
```
app/
  (tabs)/_layout.tsx       # Bottom tabs (Alarms, Trends)
  (tabs)/alarms.tsx        # Alarm list + Start session
  (tabs)/trend.tsx         # Duration bar chart + recent sessions
  alarm/edit.tsx           # Add/Edit alarm (smart wake window picker)
  sleep/live.tsx           # Live session (HR, stage, sensitivity)
  sleep/rate.tsx           # Star rating
components/
  TimeWheel.tsx
  NumberWheel.tsx
  LiveHrChart.tsx
  SleepBarChart.tsx
  NightBackground.tsx
context/
  SessionContext.tsx
services/
  alarmsStore.ts
  alarmScheduler.ts
  alarm.ts
  storage.ts
  staging.ts
  heartRateMock.ts
  clapHr.ts
  notifications.ts
```

## Data & Privacy
All data (alarms, sessions) saved locally via AsyncStorage. No external transmission. Not medical advice.

## Contributing
Open issues for bugs or feature requests; keep additions lightweight and privacy‑respecting.

## License
MIT (adjust if needed).

---
Sleep stage detection is heuristic and not a medical diagnostic tool. Use for wellness experimentation only.
