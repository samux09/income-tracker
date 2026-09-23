# Spec 002 — Automatic expense detection from card purchases

Status: Draft (research done, not yet implemented)

## Goal

When I pay with my credit or debit card, the expense is recorded automatically,
or suggested for one-tap confirmation, without typing it in.

## Options

| Option | Platforms | Cost | Feasibility | Notes |
|--------|-----------|------|-------------|-------|
| **A. Read bank app push notifications** (Android `NotificationListenerService`) | Android only | Free | ✅ Best fit | Most bank and card apps send a notification like “Purchase of $23.40 at SHELL…”. The user grants “Notification access” once. Needs a native module, so it runs in an Expo dev build or APK, not in Expo Go. Allowed for sideloaded APKs. On Google Play it needs a declaration. |
| B. Read bank SMS alerts (`READ_SMS`) | Android only | Free | ⚠️ | Works well for banks that send SMS. Google Play mostly forbids `READ_SMS` for this purpose. OK for a sideloaded APK. |
| C. iOS Shortcuts “Wallet transaction” automation → deep link `incometracker://add?amount=…&merchant=…` | iOS 17+ | Free | ⚠️ | Only for Apple Pay taps. Requires a one-time Shortcut setup. No App Store app, so this is limited. |
| D. Bank aggregation API (Plaid, Belvo, TrueLayer, GoCardless) | All | Paid / needs a backend | ❌ for now | Most reliable, but it needs a server, API keys, and usually has a cost. It also conflicts with “no backend”. |
| E. Forward bank email alerts to a parser | All | Needs a backend | ❌ for now | Same as D. |

## Chosen approach: A (with B as an optional fallback)

1. The user picks which apps to watch, for example the bank app, and grants notification access.
2. For each notification from a watched app, parse the amount and merchant using regex rules, one set per bank (configurable, with good defaults for common formats such as `$1,234.56`, `USD 12.00`, `12,50 €`).
3. Guess the category from merchant keywords (e.g. `SHELL|TEXACO|GAS` → Gasoline, `NETFLIX|SPOTIFY` → Subscriptions, `FARMACIA|PHARMACY|CVS|WALGREENS` → Pharmacy, `WALMART|SUPER` → Supermarket).
4. Save it as `source: 'auto'` in a **Pending** inbox. The user confirms, edits or dismisses it (this avoids duplicates and false positives). A setting can turn on “auto-confirm”.

## Open questions (need input)

- Which bank or card do you use? I need one or two real notification texts to write the parser.
- Does the bank send push notifications, SMS, or both?
