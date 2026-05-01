## Why

The dashboard currently only shows data for the current calendar month, making it impossible to review past spending or retroactively add/correct expenses. Users need to navigate to previous months to audit history and record late entries.

## What Changes

- Add `viewedYear` and `viewedMonth` fields to `AppState` (defaults to current month)
- Add month navigation controls (◀ Month Year ▶) in the app header
- All metrics, sparklines, expense log, and category breakdowns reflect the viewed month, not today
- Add Expense modal defaults the date to the first of the viewed month when viewing a past month
- Delete expense reloads the viewed month's expenses (not the current month)
- Incident alert is suppressed when viewing a historical month
- CSV export filename uses the viewed month (fixes hardcoded `new Date()`)
- All calculation functions that call `new Date()` internally accept an explicit `referenceDate` parameter (Option A: pure function refactor)
- No DB schema changes required — `getExpensesForMonth(year, month)` already accepts arbitrary year/month

## Capabilities

### New Capabilities
- `month-navigation`: Month selector in the header allowing the user to navigate backwards and forwards through calendar months, making the entire dashboard reflect the selected month's data

### Modified Capabilities
- None

## Impact

- `src/state.ts`: Add `viewedYear`, `viewedMonth` to `AppState`; `recompute()` passes them as `referenceDate` to calculations
- `src/calculations.ts`: `getSloPercentage`, `getDaysWithPositiveBudget`, `getDailySpendSeries`, `getCategoryDailySeries`, `getDailyBurnRate`, `getWeeklyBurnRate` — add `referenceDate` parameter replacing internal `new Date()` calls
- `src/calculations.test.ts`: Update test calls for changed function signatures
- `src/ui.ts`: Month navigation actions (`prev-month`, `next-month`); fix 4× hardcoded `getExpensesForMonth(now...)` to use viewed month; fix CSV filename; suppress incident for historical months
- `src/components/AddExpenseModal.ts`: Accept viewed month context; default date to first of viewed month for past months
- `src/main.ts`: Pass current year/month as initial `viewedYear`/`viewedMonth` to `setState`
- `index.html`: Month navigation UI in header; CSS for nav controls
