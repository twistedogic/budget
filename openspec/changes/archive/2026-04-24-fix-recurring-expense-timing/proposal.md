## Why

Recurring expenses were being generated with today's date rather than the 1st of the month, hiding committed spend until mid-month and undermining the budget's SRE-style nudge toward saving. Yearly recurring expenses had no amortization support at all.

## What Changes

- Monthly and yearly recurring expenses are now always dated the 1st of the current month when generated, so the budget reflects committed spend from day 1.
- Yearly recurring expenses are amortized: the annual amount is divided by 12 and a ₱X/mo expense row is generated each month instead of one lump sum.
- `'yearly'` is added as a valid `Frequency` option.
- The recurring expense form exposes a "Yearly (spread monthly)" option.
- The recurring panel row displays the monthly equivalent amount (e.g. `₱10,000/mo`) for yearly templates.
- UTC offset bug in `isDue` date parsing is fixed (`new Date(str + 'T00:00:00')`).

## Capabilities

### New Capabilities
- `yearly-recurring-amortization`: Support for yearly recurring templates that spread annual costs evenly across 12 monthly expense entries.

### Modified Capabilities
- `recurring-expense-generation`: Monthly (and now yearly) recurring expenses are anchored to the 1st of the month instead of the current day.

## Impact

- `src/types.ts` — `Frequency` union type extended
- `src/main.ts` — `processRecurring` and `isDue` functions updated
- `src/components/RecurringPanel.ts` — form and row display updated
- No DB schema changes; no new tables or migrations required
- No changes to `calculations.ts`, `state.ts`, or other components
