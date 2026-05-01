## 1. State

- [x] 1.1 Add `viewedYear: number` and `viewedMonth: number` fields to `AppState` interface in `src/state.ts`
- [x] 1.2 Initialise `viewedYear` and `viewedMonth` to current year/month in the default `state` object in `src/state.ts`
- [x] 1.3 Update `recompute()` in `src/state.ts` to derive `isCurrentMonth` and `referenceDate` from `viewedYear`/`viewedMonth`, and pass `referenceDate` to all date-sensitive calculation functions
- [x] 1.4 Suppress `incident` in `recompute()` when `!isCurrentMonth`

## 2. Calculations Refactor

- [x] 2.1 Add `referenceDate: Date` parameter to `getDailyBurnRate` in `src/calculations.ts`; replace internal `new Date()` with it
- [x] 2.2 Add `referenceDate: Date` parameter to `getWeeklyBurnRate` in `src/calculations.ts`; replace internal `new Date()` with it
- [x] 2.3 Add `referenceDate: Date` parameter to `getDaysWithPositiveBudget` in `src/calculations.ts`; replace internal `new Date()` with it
- [x] 2.4 Add `referenceDate: Date` parameter to `getSloPercentage` in `src/calculations.ts`; pass it through to `getDaysWithPositiveBudget`
- [x] 2.5 Add `referenceDate: Date` parameter to `getDailySpendSeries` in `src/calculations.ts`; replace internal `new Date()` with it
- [x] 2.6 Add `referenceDate: Date` parameter to `getCategoryDailySeries` in `src/calculations.ts`; replace internal `new Date()` with it

## 3. Tests

- [x] 3.1 Update all `getDailyBurnRate` calls in `src/calculations.test.ts` to pass an explicit `referenceDate`
- [x] 3.2 Update all `getWeeklyBurnRate` calls in `src/calculations.test.ts` to pass an explicit `referenceDate`
- [x] 3.3 Update all `getDaysWithPositiveBudget` / `getSloPercentage` calls in `src/calculations.test.ts` to pass an explicit `referenceDate`
- [x] 3.4 Update all `getDailySpendSeries` calls in `src/calculations.test.ts` to pass an explicit `referenceDate`
- [x] 3.5 Update all `getCategoryDailySeries` calls in `src/calculations.test.ts` to pass an explicit `referenceDate`

## 4. DB / Main Init

- [x] 4.1 Pass `viewedYear: now.getFullYear(), viewedMonth: now.getMonth()` in the initial `setState()` call in `src/main.ts`

## 5. UI — Month Navigation Actions

- [x] 5.1 Add `prev-month` and `next-month` click handlers in `ui.ts:handleClick`; each computes the new year/month, calls `setState({ viewedYear, viewedMonth, incidentDismissed: false })`, then reloads expenses from DB with `getExpensesForMonth` and calls `setState({ expenses })`
- [x] 5.2 Fix `handleAddExpense` in `ui.ts` to reload `getExpensesForMonth(state.viewedYear, state.viewedMonth)` instead of hardcoded `now.getFullYear(), now.getMonth()`
- [x] 5.3 Fix `handleDeleteExpense` in `ui.ts` to reload the viewed month instead of the current month
- [x] 5.4 Fix `saveSettingsBudget` in `ui.ts` to reload the viewed month instead of the current month
- [x] 5.5 Fix CSV export filename in `exportExpensesCsv` in `ui.ts` to use `state.viewedYear` and `state.viewedMonth + 1` instead of `new Date()`

## 6. Add Expense Modal

- [x] 6.1 Update `renderAddExpenseModal` in `src/components/AddExpenseModal.ts` to accept `viewedYear` and `viewedMonth` parameters
- [x] 6.2 Set the date field default to `YYYY-MM-01` of the viewed month when it is a past month, or `todayISO()` when it is the current month
- [x] 6.3 Update the `renderAddExpenseModal()` call in `ui.ts:buildHTML` to pass `state.viewedYear` and `state.viewedMonth`

## 7. Header UI

- [x] 7.1 Add month navigation markup (◀ button, `Month YYYY` label, ▶ button) to the header in `ui.ts:buildHTML`
- [x] 7.2 Add a historical month indicator (muted styling or badge) to the header label when `viewedMonth`/`viewedYear` is not the current month
- [x] 7.3 Add CSS for month navigation controls and historical indicator to the `<style>` block in `index.html`

## 8. Verification

- [x] 8.1 Run `npm test` — all tests pass
- [x] 8.2 Run `npm run build` — TypeScript compiles with no errors
