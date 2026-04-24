import type { Expense, RecurringTemplate, Settings } from './types';
import {
  getRemainingBudget,
  getDailyBurnRate,
  getWeeklyBurnRate,
  getSloPercentage,
  isIncident,
  getDailySpendSeries,
  getCategorySpend,
  getTrendDirection,
} from './calculations';

export interface AppState {
  settings: Settings;
  expenses: Expense[];
  recurring: RecurringTemplate[];
  incidentDismissed: boolean;
  filterCategory: string;
  // Computed
  remaining: number;
  dailyBurnRate: number;
  weeklyBurnRate: number;
  sloPercentage: number;
  incident: boolean;
  dailySeries: { date: string; amount: number }[];
  categorySpend: Record<string, number>;
  trendDirection: 'up' | 'down' | 'flat';
}

type Listener = (state: AppState) => void;

const listeners: Listener[] = [];

export let state: AppState = {
  settings: { monthlyBudget: 0, incidentThresholdPct: 10 },
  expenses: [],
  recurring: [],
  incidentDismissed: false,
  filterCategory: '',
  remaining: 0,
  dailyBurnRate: 0,
  weeklyBurnRate: 0,
  sloPercentage: 100,
  incident: false,
  dailySeries: [],
  categorySpend: {},
  trendDirection: 'flat',
};

export function subscribe(fn: Listener): void {
  listeners.push(fn);
}

export function setState(partial: Partial<AppState>): void {
  state = { ...state, ...partial };
  recompute();
  notify();
}

function recompute(): void {
  const { monthlyBudget } = state.settings;
  const { expenses } = state;

  const remaining = getRemainingBudget(monthlyBudget, expenses);
  const daily = getDailyBurnRate(expenses);
  const weekly = getWeeklyBurnRate(expenses);
  const slo = getSloPercentage(expenses, monthlyBudget);
  const incident = isIncident(remaining, monthlyBudget, state.settings.incidentThresholdPct);
  const dailySeries = getDailySpendSeries(expenses, 30);
  const categorySpend = getCategorySpend(expenses);

  // Trend: compare last 7 days vs previous 7 days
  const last7 = dailySeries.slice(-7).map((d) => d.amount);
  const prev7 = dailySeries.slice(-14, -7).map((d) => d.amount);
  const currentAvg = last7.reduce((s, v) => s + v, 0) / 7;
  const previousAvg = prev7.reduce((s, v) => s + v, 0) / 7;
  const trendDirection = getTrendDirection(currentAvg, previousAvg);

  state = {
    ...state,
    remaining,
    dailyBurnRate: daily,
    weeklyBurnRate: weekly,
    sloPercentage: slo,
    incident,
    dailySeries,
    categorySpend,
    trendDirection,
  };
}

function notify(): void {
  for (const fn of listeners) fn(state);
}
