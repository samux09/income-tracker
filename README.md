# Income Tracker

A simple app to track payments you receive and money you spend, grouped by category
(Car, Gasoline, Pharmacy, Doctors, Supermarket, Subscriptions, and more).
Built with React Native and Expo. It runs on Android and on the web.

- **Web app:** https://samux09.github.io/income-tracker/
- **Android APK:** [Releases](https://github.com/samux09/income-tracker/releases)

Your data stays on your device. Use **Settings → Export backup** to keep a copy.

## Spec-Driven Development

Every feature starts as a spec in [`specs/`](specs). Code is written only after the spec is agreed.

| Spec | Status |
|------|--------|
| [001 — Income Tracker MVP](specs/001-income-tracker/spec.md) ([plan](specs/001-income-tracker/plan.md), [tasks](specs/001-income-tracker/tasks.md)) | Implemented |
| [002 — Auto-detect card expenses](specs/002-card-autodetect/spec.md) | Draft |

To add a feature: create `specs/NNN-name/spec.md` (the what and why), then `plan.md` (the how), then `tasks.md`, and implement one task at a time.

## Develop

```bash
npm install
npm start          # press w for web, or scan the QR code with Expo Go on your phone
npm test           # unit tests
npm run typecheck
```

## Publish (free)

| Target | How |
|--------|-----|
| Web | Every push to `main` deploys to GitHub Pages (`.github/workflows/web.yml`). One-time setup: **Repo Settings → Pages → Source: GitHub Actions**. |
| Android | Push a tag: `git tag v1.0.0 && git push origin v1.0.0`. GitHub Actions builds the APK and attaches it to a Release (`.github/workflows/android.yml`). On your phone, download the APK and allow “Install unknown apps”. |

The APK is signed with a shared debug key, which is fine for personal use. To publish on
Google Play ($25 one-time fee), generate your own upload keystore first.
