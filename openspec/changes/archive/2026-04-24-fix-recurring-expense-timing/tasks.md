## 1. Types

- [x] 1.1 Add `'yearly'` to the `Frequency` union type in `src/types.ts`

## 2. Core Logic

- [x] 2.1 Add `firstOfMonthISO(year, month)` helper in `src/main.ts`
- [x] 2.2 Update `processRecurring` to set `date: firstOfMonthISO` for monthly expenses
- [x] 2.3 Update `processRecurring` to set `date: firstOfMonthISO` and `amount: template.amount / 12` (rounded) for yearly expenses
- [x] 2.4 Add `'yearly'` case to `isDue` (same check as monthly: different calendar month or year)
- [x] 2.5 Fix UTC offset bug in `isDue` date parsing (`new Date(str + 'T00:00:00')`)

## 3. UI

- [x] 3.1 Add "Yearly (spread monthly)" option to the frequency `<select>` in `RecurringPanel.ts`
- [x] 3.2 Update `frequencyLabel` to return a proper label for `'yearly'`
- [x] 3.3 Update `recurringRow` to display monthly equivalent amount with `/mo` suffix for yearly templates

## 4. Verification

- [x] 4.1 Run `npm test` — all 44 existing tests pass
- [x] 4.2 Run `npx tsc --noEmit` — no type errors
- [ ] 4.3 Manually verify: add a yearly template, confirm expense row is dated the 1st with amount ÷ 12
- [ ] 4.4 Manually verify: add a monthly template, confirm expense row is dated the 1st
