# Runtime-Terrors-Capstone

## Task Timer (Expo + TypeScript)

React Native / Expo app with five screens recreated from the reference designs: **Tasks**, **Create Task**, **Task Details**, **Active Timer** and **Edit Task**, adding:

- **F14 – Countdown timer**: per-task circular countdown with Start / Pause / Resume / Reset, "Time's up!" and Restart Timer.
- **F15 – Estimated task duration**: 5 / 15 / 30 min presets or Custom minutes (1–600), shown on cards, details and the timer.

### Files

| File | What's inside |
| --- | --- |
| `App.tsx` | Entry point loaded by `index.ts` (re-exports `src/app.tsx`) |
| `src/countdownTimer.tsx` | **F14**: timer logic, per-task registry, React hooks, circular ring, controls, card play button |
| `src/timeDuration.tsx` | **F15**: presets, validation, formatting + "How long?" picker |
| `src/shared.tsx` | Types, colors, Inter font map, icons, header, bottom nav, buttons, mascot, categories, date/time formatting |
| `src/app.tsx` | Task store (AsyncStorage), simple stack navigation, the 5 screens |

### Run

```bash
npm install
npx expo start          # scan the QR code with Expo Go
```

- `npm run typecheck` – strict TypeScript check
- `npx expo lint` – ESLint
- `EXPO_PUBLIC_TIMER_SPEED=60 npx expo start` fast-forwards timers (10 min → 10 s) for demos.

Runs in Expo Go: only uses modules bundled with it (`react-native-svg`, AsyncStorage, datetimepicker, safe-area-context, expo-font).

### Adding to an existing Expo app

Copy `src/` into your project, install the same dependencies with `npx expo install react-native-svg @react-native-async-storage/async-storage @react-native-community/datetimepicker react-native-safe-area-context expo-font @expo-google-fonts/inter`, and render the default export of `src/app.tsx` (e.g. `export { default } from './src/app';` in your `App.tsx`).
