# Plan 001 — Technical design

## Stack

| Concern      | Choice | Why |
|--------------|--------|-----|
| Framework    | Expo SDK (latest) + React Native + TypeScript | One codebase for Android and web. Free cloud-free builds. |
| Navigation   | expo-router (file-based, bottom tabs) | Built-in static web export. |
| Storage      | `@react-native-async-storage/async-storage` | Works on Android and in browsers (localStorage). No special headers needed. |
| State        | React context + reducer (`src/store`) | Small app, no extra library needed. |
| Date picker  | Plain `YYYY-MM-DD` input + “Today / Yesterday” shortcuts | Works the same on web and Android. No native dependency. |
| Backup       | `expo-file-system` + `expo-sharing` (native), Blob download (web) | Covers US-8. |
| Tests        | Jest (`jest-expo`) for pure logic | Checks the summary and grouping maths. |

## Structure

```
src/
  app/_layout.tsx          root stack + StoreProvider
  app/(tabs)/_layout.tsx   bottom tabs
  app/(tabs)/index.tsx     Transactions (US-3, US-4)
  app/(tabs)/stats.tsx     Categories breakdown (US-5)
  app/(tabs)/settings.tsx  Currency, export/import (US-8, US-9)
  app/transaction.tsx      Add/edit modal (US-1, US-2, US-6); ?id= to edit, ?type= to preset
  categories.ts        category definitions (spec §5)
  types.ts             data model (spec §6)
  store/               context, reducer, persistence, selected month
  components/          TransactionRow, MonthSwitcher
  lib/money.ts         currency formatting, amount parsing
  lib/stats.ts         pure functions: summarize, expensesByCategory, groupByDay
  lib/backup.ts        export/import
```

## Distribution pipeline

- `.github/workflows/web.yml` runs on every push to `main`. It runs `expo export -p web` with `baseUrl=/income-tracker` and deploys to GitHub Pages.
- `.github/workflows/android.yml` runs on a `v*` tag. It runs `expo prebuild -p android`, then `./gradlew assembleRelease`, and uploads the APK to the GitHub Release.
  - Signing: release uses the debug keystore from the RN template. That is fine for personal sideloading. Switch to your own keystore before using Google Play.

## Risks

- Browser localStorage can be cleared by the user or the browser. The export/import backup (US-8) mitigates this.
