## Context

The app is a personal finance tracker framed as an SRE reliability dashboard. Recurring expenses are auto-generated as `Expense` rows on app load via `processRecurring()` in `main.ts`. Previously, all generated expenses received `date: today`, meaning a monthly rent charge added on Feb 15 would only appear in the daily spend series from Feb 15 onward — making the first half of every month look deceptively healthy.

The fix anchors monthly and yearly recurring expenses to the 1st of the month, and introduces yearly frequency with 1/12 amortization per month.

## Goals / Non-Goals

**Goals:**
- Monthly recurring expenses are always dated the 1st of the current month
- Yearly recurring expenses generate a monthly row (amount ÷ 12) dated the 1st of the current month
- `'yearly'` is a valid frequency throughout the system (type, form, display)
- Budget reflects committed recurring spend from day 1 of each month

**Non-Goals:**
- Backfilling missed months for yearly templates added mid-year
- Handling partial months for newly created templates (they start generating in the current month)
- Tracking actual payment dates separately from budget dates
- Any changes to daily/weekly recurring behavior

## Decisions

### D1: Materialize as expense rows (not virtual reservations)
Yearly amortization could be handled by adjusting `getRemainingBudget` to subtract `yearlyTotal / 12` without writing DB rows. Rejected — it would require threading yearly templates through calculations, state, and every component that reads `remaining`. Writing a monthly expense row keeps the entire data flow unchanged: everything downstream just sees an expense.

### D2: Anchor to 1st of month, not start of period
Alternatives considered: use `startDate` day-of-month (e.g. rent due on the 5th → always dated the 5th). Rejected for now — the nudging intent requires budget pressure from day 1 regardless of when the bill actually arrives. Users who want accurate transaction dates can add manual expenses.

### D3: `isDue` uses same monthly check for yearly
Yearly templates fire once per calendar month (same `lastDate.getMonth() !== today.getMonth()` guard as monthly). This means a yearly template generates 12 rows/year at 1/12 the annual amount — correct amortization behavior.

### D4: Fix UTC offset in date parsing
`new Date('2025-01-01')` parses as UTC midnight, which becomes Dec 31 in UTC-1 and earlier timezones. Fixed by appending `'T00:00:00'` to parse as local time. Applied to `isDue`.

## Risks / Trade-offs

- **Retroactive date on first open**: If a user opens the app on Feb 15 for the first time that month, the generated expense is dated Feb 1. The daily sparkline shows a spike on Feb 1 retroactively. This is intentional (reflects when the commitment existed) but may surprise users who see a charge on a day they hadn't used the app. → Acceptable trade-off; no mitigation needed.
- **Yearly rounding**: `amount / 12` can produce fractional cents. Mitigated by rounding to 2 decimal places (`Math.round(amount / 12 * 100) / 100`). Cumulative rounding error over 12 months is at most ±₱0.12/year — negligible.
- **No migration for existing data**: Existing expense rows generated under the old behavior (dated mid-month) are not retroactively corrected. → Acceptable; affects only historical display, not future behavior.

## Open Questions

- Should the recurring panel show the full annual amount alongside the monthly equivalent? Currently only shows `₱X/mo`. Could add a tooltip or secondary label. Deferred to a future UX pass.
