import type { Expense } from './types';

export const INCIDENT_THRESHOLD = 10_000;

export const CATEGORIES = [
  'food',
  'transport',
  'entertainment',
  'home_repair',
  'others',
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  food: 'Food',
  transport: 'Transport',
  entertainment: 'Entertainment',
  home_repair: 'Home Repair',
  others: 'Others',
};

export const CATEGORY_COLORS: Record<string, string> = {
  food: '#f59e0b',
  transport: '#60a5fa',
  entertainment: '#a78bfa',
  home_repair: '#34d399',
  others: '#94a3b8',
};

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getRemainingBudget(monthlyBudget: number, expenses: Expense[]): number {
  const spent = expenses.reduce((sum, e) => sum + e.amount, 0);
  return monthlyBudget - spent;
}

export function getDailyBurnRate(remaining: number, year: number, month: number): number {
  const today = new Date();
  const lastDay = getDaysInMonth(year, month);
  const daysLeft = lastDay - today.getDate() + 1;
  return daysLeft > 0 ? remaining / daysLeft : 0;
}

export function getWeeklyBurnRate(daily: number): number {
  return daily * 7;
}

export function getDaysWithPositiveBudget(
  expenses: Expense[],
  monthlyBudget: number,
): number[] {
  const byDate = new Map<string, number>();
  for (const e of expenses) {
    byDate.set(e.date, (byDate.get(e.date) ?? 0) + e.amount);
  }
  const sorted = [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  let running = 0;
  const positiveDays: number[] = [];
  sorted.forEach(([, amt], i) => {
    running += amt;
    if (running <= monthlyBudget) positiveDays.push(i + 1);
  });
  return positiveDays;
}

export function getPositiveDays(expenses: Expense[], monthlyBudget: number): number {
  return getDaysWithPositiveBudget(expenses, monthlyBudget).length;
}

export function getSloPercentage(expenses: Expense[], monthlyBudget: number): number {
  const today = new Date();
  const totalDays = today.getDate();
  if (totalDays === 0) return 100;
  const positive = getPositiveDays(expenses, monthlyBudget);
  return Math.min(100, (positive / totalDays) * 100);
}

export function isIncident(remainingBudget: number): boolean {
  return remainingBudget < INCIDENT_THRESHOLD;
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
