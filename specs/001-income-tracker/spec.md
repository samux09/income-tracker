# Spec 001 — Income Tracker (MVP)

Status: Approved for implementation
Owner: Kevin Lizarraga
Created: 2026-09-22

## 1. Problem

I want one simple place to record money I receive (payments/income) and money I
spend (expenses), grouped by category, so I can see where my money goes each month.

## 2. Goals

- Record income and expenses in a few taps.
- Categorize every transaction.
- See the current month's balance (income − expenses) and spending per category.
- Run on Android (installable APK) and on the web, published at no cost.

## 3. Non-goals (MVP)

- User accounts, cloud sync, or multi-device sharing.
- Multiple currencies per transaction.
- Budgets, recurring transactions, and charts beyond a simple per-category breakdown.
- Automatic credit-card detection (see Spec 002).

## 4. User stories

| ID   | As a user I want to…                                           | Acceptance criteria |
|------|----------------------------------------------------------------|---------------------|
| US-1 | add an **expense** with amount, category, date and an optional note | Amount > 0 is required. Category is required. Date defaults to today. Saved entry appears at the top of the list right away. |
| US-2 | add an **income** (payment received) with amount, category, date and an optional note | Same rules as US-1, using the income categories. |
| US-3 | see a list of my transactions for a month | Newest first. Grouped by day. Expenses show in red with “−”, income in green with “+”. Arrows switch to the previous or next month. |
| US-4 | see a monthly summary | Shows total income, total expenses and balance for the selected month. |
| US-5 | see spending per category for the month | Expense categories are sorted by total, with amount and % of monthly expenses. |
| US-6 | edit or delete a transaction | Tap an item to open it for editing. Deleting asks for confirmation. |
| US-7 | keep my data after closing the app | Data is stored on the device and survives restarts. |
| US-8 | back up and restore my data | Export all data as JSON (share or download). Import JSON replaces the current data after confirmation. |
| US-9 | choose my currency | A setting sets the currency code (default `USD`). Amounts are formatted with it. |

## 5. Categories

Built-in and fixed for the MVP. Each has an id, label, icon and color.

**Expense:** Car, Gasoline, Pharmacy, Doctors, Supermarket, Subscriptions,
Restaurants, Home & Utilities, Entertainment, Education, Clothing, Other.

**Income:** Salary, Freelance, Transfer received, Refund, Other income.

## 6. Data model

```ts
type TransactionType = 'income' | 'expense';

interface Transaction {
  id: string;          // unique id
  type: TransactionType;
  amount: number;      // positive, in major units (e.g. 12.50)
  categoryId: string;  // must belong to the matching type's category list
  date: string;        // ISO date 'YYYY-MM-DD'
  note?: string;
  source: 'manual' | 'auto'; // 'auto' is reserved for Spec 002
  createdAt: string;   // ISO datetime
}

interface Settings { currency: string }
```

## 7. Platforms and distribution

- **Android:** a signed APK built by GitHub Actions and attached to a GitHub Release. Free, installed by sideloading. (Google Play needs a one-time $25 fee, so it is optional and out of scope.)
- **Web:** a static export deployed to GitHub Pages by GitHub Actions. Free.
- **iOS:** works in Expo Go during development. No App Store distribution, because it needs a $99/year account.

## 8. Constraints

- React Native with Expo (TypeScript).
- Offline-first: no backend.
- Storage must also work on GitHub Pages, which can't set custom headers. Use AsyncStorage (localStorage on the web), not SQLite/WASM.
