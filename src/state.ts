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
  viewedYear: number;
  viewedMonth: number; // 0-indexed, matching Date.getMonth()
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

const _now = new Date();

export let state: AppState = {
  settings: { monthlyBudget: 0, incidentThresholdPct: 10 },
  expenses: [],
  recurring: [],
  incidentDismissed: false,
  filterCategory: '',
  viewedYear: _now.getFullYear(),
  viewedMonth: _now.getMonth(),
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
  const { expenses, viewedYear, viewedMonth } = state;

  const now = new Date();
  const isCurrentMonth =
    viewedYear === now.getFullYear() && viewedMonth === now.getMonth();
  const referenceDate = isCurrentMonth
    ? now
    : new Date(viewedYear, viewedMonth + 1, 0); // last day of viewed month

  const remaining = getRemainingBudget(monthlyBudget, expenses);
  const daily = getDailyBurnRate(expenses, referenceDate);
  const weekly = getWeeklyBurnRate(expenses, referenceDate);
  const slo = getSloPercentage(expenses, monthlyBudget, referenceDate);
  const incident = isCurrentMonth
    ? isIncident(remaining, monthlyBudget, state.settings.incidentThresholdPct)
    : false;
  const dailySeries = getDailySpendSeries(expenses, 30, referenceDate);
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
