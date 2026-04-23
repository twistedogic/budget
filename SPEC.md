# Budget SLO Dashboard — Specification

## 1. Project Overview

**Name:** budget-slo-dashboard
**Type:** Progressive Web App (PWA)
**Summary:** Personal finance tracker framed as an SRE reliability dashboard. Budget is the SLO, spending is error budget consumption, and incidents fire when remaining budget drops below a threshold.
**Stack:** Vite + TypeScript + Dexie.js (IndexedDB) + Vitest (unit tests) + PWA (vite-plugin-pwa)

---

## 2. UI/UX Specification

### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│  Header: "Budget SLO Dashboard"         [Settings]   │
├─────────────────────────────────────────────────────┤
│  Alert Banner (conditional — incident warning)       │
├───────────────────┬────────────────────────────────┤
│  Monthly Budget   │  Remaining Budget  [sparkline] │
│  [editable]       │  [trend arrow]                  │
├───────────────────┼────────────────────────────────┤
│  Daily Burn Rate  │  Weekly Burn Rate              │
│  $X/day           │  $X/week                        │
├───────────────────┼────────────────────────────────┤
│  SLO Meter        │  Error Budget Bar               │
│  [███████░░░] 87% │  [██████████░░░░░░░] 87%     │
├───────────────────┴────────────────────────────────┤
│  Monthly Spend by Category                         │
│  [sparkline per category] [trend arrow]           │
├─────────────────────────────────────────────────────┤
│  Expense Log (scrollable list)                    │
│  [+ Add Expense]                                  │
├─────────────────────────────────────────────────────┤
│  Recurring Expenses (manage recurring)             │
│  [+ Add Recurring]                                 │
└─────────────────────────────────────────────────────┘
```

**Responsive:** Single column on mobile (<640px), two-column grid on desktop.

### Visual Design

**Color Palette:**
- Background: `#0f1117` (deep dark)
- Card background: `#1a1d27`
- Card border: `#2a2d3a`
- Primary accent: `#f59e0b` (amber — "warning" energy)
- Positive / on-track: `#22c55e` (green)
- Negative / incident: `#ef4444` (red)
- Neutral / info: `#60a5fa` (blue)
- Text primary: `#f1f5f9`
- Text secondary: `#94a3b8`
- Text muted: `#475569`

**Typography:**
- Font: `Geist Mono` (Google Fonts) for numbers; `Geist` for text
- Fallback: `ui-monospace, 'Cascadia Code', monospace`
- Headings: 600 weight, tracking tight
- Numbers: Tabular figures, monospace

**Spacing:**
- Card padding: 20px
- Grid gap: 16px
- Section spacing: 24px

**Visual Effects:**
- Cards: `border-radius: 12px`, subtle `border: 1px solid #2a2d3a`
- Hover on cards: `border-color: #f59e0b40`
- Alert banner: red glow `box-shadow: 0 0 20px #ef444440`
- Number transitions: CSS counter animation 400ms ease

### Components

**1. Alert Banner**
- Shown when `remainingBudget < INCIDENT_THRESHOLD ($10,000)`
- States: hidden, warning (amber), incident (red pulse)
- Text: "⚠️ INCIDENT: Budget critical — $X remaining"
- Dismiss: X button (dismisses for session, not persisted)

**2. Budget Card (editable)**
- Click to edit monthly budget inline
- Save on Enter or blur
- Shows: input field + "Monthly Budget" label

**3. Remaining Budget Card**
- Large number display (tabular figures)
- Sparkline (last 30 days of daily spend trend)
- Arrow indicator: ↑ green (spending under budget), → amber (near budget), ↓ red (over budget)

**4. Burn Rate Cards (Daily / Weekly)**
- Icon: `flame` or `trending-down`
- Number in large monospace
- Subtext: "per day" / "per week"

**5. SLO Meter**
- Circular progress ring (SVG)
- Percentage: `(positiveDays / totalDays) * 100`
- Color: green >85%, amber 70-85%, red <70%
- Center text: `87%`

**6. Error Budget Bar**
- Horizontal bar
- Fill: `(remainingBudget / monthlyBudget) * 100`
- Segments colored by threshold zones
- Label: "X% remaining"

**7. Category Sparklines**
- 5 categories: food, transport, entertainment, home repair, others
- Mini sparkline per category (last 30 days)
- Arrow trend next to each
- Bar showing current month spend vs category budget

**8. Expense Log**
- List of entries: date, category badge, amount, note
- Color-coded by category
- Delete button per entry
- Filter by category (dropdown)

**9. Add Expense Modal**
- Fields: amount (number), category (select), date (date picker), note (text), type (one-time / recurring-template)
- "Add" button
- Closes on submit

**10. Recurring Expenses Panel**
- List: name, amount, frequency (daily/weekly/monthly), next occurrence
- Add / delete recurring templates
- Auto-populates expense log on due date (on app load)

---

## 3. Functionality Specification

### Core Features

1. **Set Monthly Budget** — user inputs monthly budget (persisted to IndexedDB)
2. **Add One-Time Expense** — amount, category, date, note (persisted)
3. **Add Recurring Template** — creates template; auto-generates expense entries on due dates
4. **Delete Expense** — remove entry from log
5. **Calculate Remaining Budget** — `monthlyBudget - sum(monthExpenses)`
6. **Calculate Daily/Weekly Burn Rate** — remaining divided by days left in month / 7
7. **Calculate SLO %** — `(daysWithPositiveBudget / totalDaysInMonth) * 100`
8. **Detect Incident** — remaining < $10,000 → show alert
9. **Sparkline Trend** — last 30 days daily spend sparkline per category and overall
10. **Arrow Trend** — compare current week avg vs previous week avg
11. **PWA Install** — works offline, installable
12. **GitHub Pages Deploy** — static output to `dist/`

### Calculation Logic (to be unit tested)

```typescript
// src/calculations.ts
export const INCIDENT_THRESHOLD = 10_000;

export function getDaysInMonth(year: number, month: number): number
export function getRemainingBudget(monthlyBudget: number, expenses: Expense[]): number
export function getDailyBurnRate(remaining: number, year: number, month: number): number
export function getWeeklyBurnRate(daily: number): number
export function getSloPercentage(expenses: Expense[], monthlyBudget: number): number
export function getPositiveDays(expenses: Expense[], monthlyBudget: number): number
export function getDaysWithPositiveBudget(expenses: Expense[], monthlyBudget: number): number[]
export function isIncident(remainingBudget: number): boolean
export function getTrendDirection(currentAvg: number, previousAvg: number): 'up' | 'down' | 'flat'
export function getDailySpendSeries(expenses: Expense[], days: number): { date: string; amount: number }[]
export function getCategorySpend(expenses: Expense[]): Record<string, number>
```

### Data Flow

1. App loads → Dexie initializes → load all data from IndexedDB
2. Check recurring templates → auto-generate any overdue expenses
3. Compute all calculations
4. Render UI reactively (vanilla TS, no framework — simple state object + re-render on change)

### Edge Cases

- No expenses yet: show empty state, burn rate = monthlyBudget / daysInMonth
- Month with no budget set: prompt to set budget
- Recurring expense past due on load: create entry for today
- Negative remaining budget: show in red, incident state

---

## 4. Technical Specification

### File Structure

```
budget-slo-dashboard/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── src/
│   ├── main.ts              # Entry point, app init
│   ├── state.ts             # Reactive state management
│   ├── calculations.ts       # Pure calculation functions (unit tested)
│   ├── calculations.test.ts # Vitest unit tests
│   ├── db.ts                # Dexie schema + CRUD
│   ├── ui.ts                # DOM rendering functions
│   ├── components/
│   │   ├── AlertBanner.ts
│   │   ├── BudgetCard.ts
│   │   ├── RemainingCard.ts
│   │   ├── BurnRateCard.ts
│   │   ├── SloMeter.ts
│   │   ├── ErrorBudgetBar.ts
│   │   ├── CategorySparklines.ts
│   │   ├── ExpenseLog.ts
│   │   ├── AddExpenseModal.ts
│   │   └── RecurringPanel.ts
│   ├── utils/
│   │   ├── sparkline.ts     # Canvas sparkline renderer
│   │   └── format.ts        # Currency, date formatting
│   └── types.ts             # TypeScript interfaces
├── public/
│   └── favicon.svg
└── dist/                    # GitHub Pages output
```

### Dependencies

```json
{
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.4.0",
    "vite-plugin-pwa": "^0.20.0",
    "vitest": "^1.4.0",
    "@vitest/ui": "^1.4.0"
  },
  "dependencies": {
    "dexie": "^4.0.0"
  }
}
```

### PWA Config (vite.config.ts)

- `registerType: 'autoUpdate'`
- `manifest`: name, short_name, theme_color `#0f1117`, background_color `#0f1117`, display `standalone`
- Workbox `GenerateSW` strategy: NetworkFirst for app shell, CacheFirst for assets

### GitHub Pages Deploy

- Vite base: `/budget-slo-dashboard/` (repo name)
- Deploy script: `npx vite build` → push to `gh-pages` branch
- Or GitHub Actions workflow in `.github/workflows/deploy.yml`

### Sparkline Spec

- Canvas-based, 80px × 24px
- Data: normalized 0–max value
- Fill: gradient from accent color to transparent
- Stroke: 1.5px accent color
- No axes, no labels — pure trend visual

### Arrow Trend Spec

- ↑ green (`#22c55e`): current > previous by >5%
- ↓ red (`#ef4444`): current < previous by >5%
- → amber (`#f59e0b`): within ±5%

---

## 5. Acceptance Criteria

- [ ] Monthly budget can be set and persists across sessions
- [ ] One-time expenses can be added with category + date
- [ ] Recurring templates auto-generate expenses on due dates
- [ ] Remaining budget updates immediately on expense add/delete
- [ ] Incident alert fires when remaining < $10,000
- [ ] SLO % reflects actual positive-day ratio
- [ ] Sparklines render for overall + each category
- [ ] Trend arrows update correctly
- [ ] App installs as PWA and works offline
- [ ] Unit tests pass for all calculation functions
- [ ] Deployed to GitHub Pages at `<username>.github.io/budget-slo-dashboard/`
