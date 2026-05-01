## Context

The dashboard loads expenses exclusively for the current calendar month. All calculations (`getSloPercentage`, `getDailySpendSeries`, `getDailyBurnRate`, etc.) internally call `new Date()` to anchor their results. There is no concept of a "viewed month" in state — time context is implicitly "right now" throughout the codebase.

`getExpensesForMonth(year, month)` in `db.ts` is already parameterised and works for any month. The gap is entirely in state and calculations.

## Goals / Non-Goals

**Goals:**
- Navigate to any past (or future) calendar month via header controls
- All dashboard metrics reflect the viewed month's data
- Add and delete expenses while viewing any month
- CSV export filename uses the viewed month
- Calculations remain pure functions (no global state reads)

**Non-Goals:**
- Multi-month aggregation or trend views across months
- Per-month budget settings (budget is still a single global value)
- Recurring template management scoped to a month
- Persisting the last-viewed month across page loads (always starts on current month)

## Decisions

### 1. `referenceDate` parameter on all date-sensitive calculations

**Decision:** Add a `referenceDate: Date` parameter to every calculation function that currently calls `new Date()` internally: `getDailyBurnRate`, `getWeeklyBurnRate`, `getDaysWithPositiveBudget`, `getSloPercentage`, `getDailySpendSeries`, `getCategoryDailySeries`.

**Rationale:** Keeps calculations pure and fully testable without mocking system time. `recompute()` in `state.ts` constructs the reference date from `state.viewedYear`/`state.viewedMonth` (last day of month for completed months, today for current month) and passes it down. All existing tests remain straightforward — pass an explicit date instead of relying on `new Date()`.

**Alternative considered:** Store viewed month in a module-level variable in `state.ts` and read it inside calculations. Rejected — calculations would no longer be pure; tests would require setup/teardown of shared state.

### 2. Reference date semantics for past months

**Decision:** For a completed past month, `referenceDate` is the last day of that month. For the current month, it is today.

**Rationale:**
- SLO % denominator becomes `daysInMonth` (all days evaluated) for past months, vs `today.getDate()` for current month — correct historical view.
- Daily/weekly burn rate for past months uses the last 7 days of that month as the window — consistent with how the metric is defined.
- Sparklines show the full 30-day window ending on the reference date.

**Computed in `recompute()`:**
```typescript
const now = new Date();
const isCurrentMonth = state.viewedYear === now.getFullYear() && state.viewedMonth === now.getMonth();
const referenceDate = isCurrentMonth
  ? now
  : new Date(state.viewedYear, state.viewedMonth + 1, 0); // last day of viewed month
```

### 3. `viewedYear` + `viewedMonth` in AppState

**Decision:** Add `viewedYear: number` and `viewedMonth: number` (0-indexed, matching `Date.getMonth()`) to `AppState`. Initialized to current year/month in `main.ts`.

**Rationale:** Matches the existing state pattern — all UI-level context lives in `AppState`. Navigation actions (`prev-month`, `next-month`) call `setState({ viewedYear, viewedMonth })` then reload expenses from DB, exactly like the settings save flow.

### 4. Incident suppressed for historical months

**Decision:** When `!isCurrentMonth`, `incident` is always `false` regardless of the remaining budget calculation.

**Rationale:** An incident alert on a month that has already ended is noise — it's historical information, not an actionable alert. The remaining budget figure is still shown (useful for reference), just without the alert banner.

### 5. Add Expense modal date default

**Decision:** When viewing a past month, the date field defaults to the first of the viewed month (`YYYY-MM-01`). When viewing the current month, it defaults to today (existing behaviour).

**Rationale:** Most backdating scenarios involve filling in a whole month's worth of missing entries — starting at the first is a reasonable anchor. The field remains editable.

**No cross-month validation:** If the user types a date outside the viewed month, the expense is saved silently under that date. The viewed month display does not change. The user can navigate to that month to see it.

### 6. Month navigation placement — header (Option A)

**Decision:** Navigation controls live in the app header, between the title block and the settings button.

**Rationale:** Makes the month context feel like a global dashboard setting rather than a local filter on the expense log. A historical month indicator (e.g. subtle badge or muted header colour) signals clearly that the user is not viewing live data.

## Risks / Trade-offs

**[Stale `incidentDismissed` flag]** → When navigating months, `incidentDismissed` should reset so that navigating back to the current month and triggering an incident shows the alert. Mitigation: `setState({ viewedYear, viewedMonth, incidentDismissed: false })` on every month change.

**[Calculation signature churn]** → Adding `referenceDate` to 6 functions means updating every call site, including tests. Mitigation: TypeScript strict mode will surface all missed call sites at compile time. Tests should be updated in the same task as the calculation changes.

**[Weekly burn rate crosses month boundary]** → For past months, the last-7-days window on the last day of month may include days from the previous month, but state only contains the viewed month's expenses — so those cross-month days will show as zero. This is acceptable: it matches the data available and avoids loading two months into state simultaneously.
