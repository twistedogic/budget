import type { Expense } from './types';

export const INCIDENT_THRESHOLD = 10_000;

export const CATEGORIES = [
  'education',
  'entertainment',
  'food',
  'home',
  'others',
  'transport',
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  education: 'Education',
  entertainment: 'Entertainment',
  food: 'Food',
  home: 'Home',
  others: 'Others',
  transport: 'Transport',
};

export const CATEGORY_COLORS: Record<string, string> = {
  education: '#f472b6',
  entertainment: '#a78bfa',
  food: '#f59e0b',
  home: '#fb923c',
  others: '#94a3b8',
  transport: '#60a5fa',
};

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getRemainingBudget(monthlyBudget: number, expenses: Expense[]): number {
  const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
  return monthlyBudget - spent;
}

export function getDailyBurnRate(expenses: Expense[]): number {
  const today = new Date().toISOString().slice(0, 10);
  return expenses
    .filter((e) => e.date === today && !e.recurringId)
    .reduce((sum, e) => sum + e.amount, 0);
}

export function getWeeklyBurnRate(expenses: Expense[]): number {
  const today = new Date();
  let total = 0;
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    total += expenses
      .filter((e) => e.date === dateStr && !e.recurringId)
      .reduce((sum, e) => sum + e.amount, 0);
  }
  return total / 7;
}

export function getDaysWithPositiveBudget(
  expenses: Expense[],
  monthlyBudget: number,
): number[] {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const dailyBudget = monthlyBudget / daysInMonth;

  const byDate = new Map<string, number>();
  for (const e of expenses) {
    byDate.set(e.date, (byDate.get(e.date) ?? 0) + e.amount);
  }

  const positiveDays: number[] = [];
  for (let day = 1; day <= today.getDate(); day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const spent = byDate.get(dateStr) ?? 0;
    if (spent < dailyBudget) positiveDays.push(day);
  }
  return positiveDays;
}

export function getPositiveDays(expenses: Expense[], monthlyBudget: number): number {
  return getDaysWithPositiveBudget(expenses, monthlyBudget).length;
}

export function getSloPercentage(expenses: Expense[], monthlyBudget: number): number {
  if (monthlyBudget <= 0) return 100;
  const today = new Date();
  const totalDays = today.getDate();
  if (totalDays === 0) return 100;
  const positive = getPositiveDays(expenses, monthlyBudget);
  return Math.min(100, (positive / totalDays) * 100);
}

export function isIncident(remainingBudget: number, monthlyBudget: number, thresholdPct: number): boolean {
  if (monthlyBudget <= 0) return false;
  return remainingBudget < (monthlyBudget * thresholdPct) / 100;
}

export function getTrendDirection(
  currentAvg: number,
  previousAvg: number,
): 'up' | 'down' | 'flat' {
  if (previousAvg === 0) return 'flat';
  const diff = (currentAvg - previousAvg) / previousAvg;
  if (diff > 0.05) return 'up';
  if (diff < -0.05) return 'down';
  return 'flat';
}

export function getDailySpendSeries(
  expenses: Expense[],
  days: number,
): { date: string; amount: number }[] {
  const result: { date: string; amount: number }[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const amount = expenses
      .filter((e) => e.date === dateStr)
      .reduce((s, e) => s + e.amount, 0);
    result.push({ date: dateStr, amount });
  }
  return result;
}

export function getCategorySpend(expenses: Expense[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const e of expenses) {
    result[e.category] = (result[e.category] ?? 0) + e.amount;
  }
  return result;
}

export function getCategoryDailySeries(
  expenses: Expense[],
  category: string,
  days: number,
): number[] {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (days - 1 - i));
    const dateStr = d.toISOString().slice(0, 10);
    return expenses
      .filter((e) => e.date === dateStr && e.category === category)
      .reduce((s, e) => s + e.amount, 0);
  });
}
