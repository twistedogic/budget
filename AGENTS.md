# AGENTS.md — Budget SLO Dashboard

Personal finance tracker framed as an SRE reliability dashboard. Budget = SLO, spending = error budget consumption, incidents fire when remaining budget < $10,000.

**Stack:** Vite + TypeScript (strict) + Dexie.js (IndexedDB) + Vitest + vite-plugin-pwa

---

## Commands

```bash
npm run dev          # Start dev server (base path: /)
npm run build        # Type-check (tsc) + Vite bundle (outputs to dist/)
npm test             # Run unit tests once (vitest run)
npm run test:watch   # Vitest in watch mode
npm run preview      # Preview the built output
npm run deploy       # Build + push dist/ to gh-pages branch
```

> CI (`.github/workflows/deploy.yml`) runs `npm test` then `npm run build` then deploys to GitHub Pages on every push to `main`.

---

## Project Structure

```
src/
  main.ts              # Entry — loads DB, processes recurring, initialises state, subscribes
  state.ts             # Reactive state store (setState → recompute → notify → re-render)
  calculations.ts      # Pure functions only — the only file with unit tests
  calculations.test.ts # Vitest tests for calculations.ts
  db.ts                # Dexie schema + all CRUD helpers
  ui.ts                # renderApp() + all event delegation logic
  types.ts             # TypeScript interfaces (Expense, RecurringTemplate, Settings)
  components/          # Each file exports one render*() → string function
    AlertBanner.ts
    AddExpenseModal.ts
    BudgetCard.ts
    BurnRateCard.ts
    CategorySparklines.ts
    ErrorBudgetBar.ts
    ExpenseLog.ts
    RecurringPanel.ts
    RemainingCard.ts
    SettingsPanel.ts
    SloMeter.ts
  utils/
    format.ts          # formatCurrency, formatDate, todayISO, escapeHtml
    sparkline.ts       # Canvas-based mini sparkline renderer
public/
  favicon.svg
index.html             # App shell — ALL CSS lives here as inline <style>
```

---

## Architecture Patterns

### Rendering model (no framework)
Components are **pure functions that return HTML strings**:

```typescript
export function renderBudgetCard(state: AppState): string {
  return `<div class="card">...</div>`;
}
```

`renderApp(el)` in `ui.ts` does:
1. `el.innerHTML = buildHTML()` — full DOM replacement on every state change
2. `attachEvents(el)` — re-attaches all event listeners via delegation
3. `drawAllSparklines()` — redraws canvas sparklines after innerHTML is set

Canvases must be drawn after `innerHTML` is set; never draw inside component functions.

### State management
```typescript
// state.ts
export let state: AppState = { ... };  // exported mutable reference

setState(partial)   // → spreads partial, calls recompute(), then notify()
subscribe(fn)       // → fn(state) called after every setState()
```

- All computed fields (`remaining`, `dailyBurnRate`, `sloPercentage`, etc.) are recalculated in `recompute()` — never compute them manually elsewhere.
- Never mutate `state` directly. Always use `setState()`.
- After any DB write that changes expenses or settings, reload from DB and call `setState()`.

### Event handling
All click/change/submit events are delegated from the root `#app` element via `data-action` attributes:

```html
<button data-action="delete-expense" data-id="${expense.id}">✕</button>
```

```typescript
// ui.ts attachEvents()
el.addEventListener('click', handleClick);
// handleClick reads: target.closest('[data-action]')?.getAttribute('data-action')
```

Do not add direct `addEventListener` calls inside component render functions.

### Persistence (Dexie / IndexedDB)
- Database name: `budget-slo-db` (Dexie v4)
- Tables: `expenses` (`++id, date, category, recurringId`), `recurring` (`++id, frequency`), `settings` (`++id`)
- All DB access goes through helpers in `db.ts` — don't call `db.*` directly from components or state
- `getExpensesForMonth(year, month)` filters by `YYYY-MM` prefix — **only current month expenses are loaded into state**
- `Settings` is a single-row table; `loadSettings()` creates the row if missing

### Recurring expenses
`processRecurring(templates)` in `main.ts` runs on every app load. It auto-generates expense entries for any overdue recurring templates and updates `lastGenerated`. After processing, expenses are re-loaded from DB before populating state.

---

## Types

```typescript
type Category = 'food' | 'transport' | 'entertainment' | 'home_repair' | 'others';
type Frequency = 'daily' | 'weekly' | 'monthly';

interface Expense { id?: number; amount: number; category: Category; date: string; note: string; recurringId?: number; }
interface RecurringTemplate { id?: number; name: string; amount: number; category: Category; frequency: Frequency; startDate: string; lastGenerated?: string; }
interface Settings { id?: number; monthlyBudget: number; }
```

Dates are always `YYYY-MM-DD` strings (ISO 8601 date only, no time component).

---

## Calculations Reference

All pure functions in `src/calculations.ts`:

| Function | Purpose |
|---|---|
| `getRemainingBudget(budget, expenses)` | `budget - sum(expenses)` |
| `getDailyBurnRate(remaining, year, month)` | `remaining / daysLeftInMonth` |
| `getWeeklyBurnRate(daily)` | `daily * 7` |
| `getSloPercentage(expenses, budget)` | `(positiveDays / dayOfMonth) * 100` |
| `getPositiveDays(expenses, budget)` | Count of days where cumulative spend ≤ budget |
| `isIncident(remaining)` | `remaining < INCIDENT_THRESHOLD (10_000)` |
| `getTrendDirection(current, prev)` | `'up'` \| `'down'` \| `'flat'` (±5% threshold) |
| `getDailySpendSeries(expenses, days)` | Last N days as `{date, amount}[]` |
| `getCategorySpend(expenses)` | `Record<category, totalAmount>` |
| `getCategoryDailySeries(expenses, cat, days)` | Per-category daily amounts as `number[]` |

Constants exported from `calculations.ts`:
- `INCIDENT_THRESHOLD = 10_000`
- `CATEGORIES` — const array of all category keys
- `CATEGORY_LABELS` — display names
- `CATEGORY_COLORS` — hex color per category

---

## Styling

**All CSS is inline in `index.html`** — there are no `.css` files or CSS imports. When adding new styles, add them to the `<style>` block in `index.html`.

CSS custom properties (defined in `:root`):

| Variable | Value | Use |
|---|---|---|
| `--bg` | `#0f1117` | Page background |
| `--card-bg` | `#1a1d27` | Card backgrounds |
| `--card-border` | `#2a2d3a` | Card borders |
| `--accent` | `#f59e0b` | Amber — primary accent |
| `--positive` | `#22c55e` | Green — on-track |
| `--negative` | `#ef4444` | Red — incident/over budget |
| `--info` | `#60a5fa` | Blue — neutral info |
| `--text-primary` | `#f1f5f9` | Main text |
| `--text-secondary` | `#94a3b8` | Secondary text |
| `--text-muted` | `#475569` | Muted/labels |
| `--font-mono` | `'Geist Mono'` | Numbers, code |
| `--font-sans` | `'Geist'` | Body text |

Use utility classes `.positive`, `.warning`, `.negative`, `.text-muted`, `.text-secondary`, `.mono` for colored/styled text. Use `.hidden` (sets `display: none !important`) to show/hide elements.

---

## Testing

Tests live exclusively in `src/calculations.test.ts` and cover only `calculations.ts` (pure functions). The Vitest environment is `node` — no DOM APIs are available in tests.

```typescript
// Test helper pattern
const mkExp = (date: string, amount: number, category = 'food'): Expense => ({
  amount, category, date, note: '',
});
```

When adding new pure functions to `calculations.ts`, add corresponding tests in `calculations.test.ts`. Components and DB functions are not unit tested.

---

## Key Gotchas

1. **Full DOM replacement on every render** — `renderApp()` calls `el.innerHTML = buildHTML()`. Event listeners added inside component functions will be lost. All event wiring belongs in `ui.ts:attachEvents()`.

2. **Canvas sparklines after innerHTML** — `drawAllSparklines()` must run after innerHTML is set. Canvas element IDs follow the pattern `sparkline-main` and `sparkline-cat-{category}`.

3. **Always escape user input** — use `escapeHtml()` from `utils/format.ts` before interpolating any user-provided strings (notes, names) into HTML template literals.

4. **Current month only** — `getExpensesForMonth` filters by current month. Expenses from prior months are not loaded into state and don't affect calculations.

5. **Build base path** — `vite.config.ts` sets `base: '/budget/'` for production builds and `'/'` for dev. The GitHub Pages deployment URL is `<user>.github.io/budget/`.

6. **TypeScript strict mode** — `noUnusedLocals` and `noUnusedParameters` are enabled. `tsc` runs as part of `npm run build` but does not emit (Vite handles bundling). Fix all TS errors before building.

7. **Dexie `Table<T, K>` typing** — the `!` (definite assignment) on table properties (`expenses!`, `recurring!`, `settings!`) is required by Dexie's class-based schema pattern.

8. **Modal visibility** — modals use `classList.add('hidden')` / `classList.remove('hidden')`. The `.hidden` utility class uses `!important`. Form `reset()` and error-clearing happen on close, not on open.

9. **Date string format** — always use `YYYY-MM-DD`. Use `todayISO()` from `utils/format.ts` for today's date. Parse dates with `new Date(dateStr + 'T00:00:00')` (add time to avoid UTC offset issues).

10. **`state` is a `let` export** — after `setState()`, the `state` reference is replaced (not mutated in-place). Code that captures `const s = state` before an async operation may hold a stale reference.
