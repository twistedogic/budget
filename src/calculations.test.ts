import { describe, it, expect } from 'vitest';
import {
  getDaysInMonth,
  getRemainingBudget,
  getDailyBurnRate,
  getWeeklyBurnRate,
  getSloPercentage,
  getPositiveDays,
  getDaysWithPositiveBudget,
  isIncident,
  getTrendDirection,
  getDailySpendSeries,
  getCategorySpend,
  getCategoryDailySeries,
} from './calculations';
import type { Expense } from './types';

const mkExp = (date: string, amount: number, category: Expense['category'] = 'food'): Expense => ({
  amount,
  category,
  date,
  note: '',
});

describe('getDaysInMonth', () => {
  it('returns 31 for January', () => expect(getDaysInMonth(2024, 0)).toBe(31));
  it('returns 28 for February 2023', () => expect(getDaysInMonth(2023, 1)).toBe(28));
  it('returns 29 for February 2024 (leap year)', () => expect(getDaysInMonth(2024, 1)).toBe(29));
  it('returns 30 for April', () => expect(getDaysInMonth(2024, 3)).toBe(30));
  it('returns 31 for December', () => expect(getDaysInMonth(2024, 11)).toBe(31));
});

describe('getRemainingBudget', () => {
  it('subtracts expenses from budget', () => {
    const expenses = [mkExp('2024-01-01', 100), mkExp('2024-01-02', 200)];
    expect(getRemainingBudget(1000, expenses)).toBe(700);
  });
  it('returns full budget when no expenses', () => {
    expect(getRemainingBudget(5000, [])).toBe(5000);
  });
  it('can go negative', () => {
    expect(getRemainingBudget(100, [mkExp('2024-01-01', 200)])).toBe(-100);
  });
  it('handles single expense exactly equal to budget', () => {
    expect(getRemainingBudget(500, [mkExp('2024-01-01', 500)])).toBe(0);
  });
});

describe('getDailyBurnRate', () => {
  it('returns sum of non-recurring expenses for today', () => {
    const today = new Date().toISOString().slice(0, 10);
    const expenses: Expense[] = [
      mkExp(today, 100),
      mkExp(today, 200),
      mkExp(today, 50, 'transport'), // also today, no recurringId
    ];
    expect(getDailyBurnRate(expenses)).toBe(350);
  });
  it('excludes recurring expenses', () => {
    const today = new Date().toISOString().slice(0, 10);
    const expenses: Expense[] = [
      mkExp(today, 100),
      { ...mkExp(today, 5000), recurringId: 1 },
    ];
    expect(getDailyBurnRate(expenses)).toBe(100);
  });
  it('returns 0 with no expenses today', () => {
    expect(getDailyBurnRate([])).toBe(0);
  });
});

describe('getWeeklyBurnRate', () => {
  it('returns average daily non-recurring spend over last 7 days', () => {
    const today = new Date();
    const expenses: Expense[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      return mkExp(d.toISOString().slice(0, 10), 700);
    });
    expect(getWeeklyBurnRate(expenses)).toBeCloseTo(700);
  });
  it('excludes recurring expenses', () => {
    const today = new Date().toISOString().slice(0, 10);
    const expenses: Expense[] = [
      mkExp(today, 700),
      { ...mkExp(today, 9999), recurringId: 2 },
    ];
    expect(getWeeklyBurnRate(expenses)).toBeCloseTo(100); // 700 / 7
  });
  it('returns 0 with no expenses', () => {
    expect(getWeeklyBurnRate([])).toBe(0);
  });
});

describe('isIncident', () => {
  const budget = 100_000;
  const pct = 10; // 10% of 100_000 = 10_000
  it('returns true when remaining is below threshold %', () => expect(isIncident(9_999, budget, pct)).toBe(true));
  it('returns false when remaining is above threshold %', () => expect(isIncident(10_001, budget, pct)).toBe(false));
  it('returns false at exactly threshold %', () => expect(isIncident(10_000, budget, pct)).toBe(false));
  it('returns true for negative remaining', () => expect(isIncident(-100, budget, pct)).toBe(true));
  it('returns true for zero remaining', () => expect(isIncident(0, budget, pct)).toBe(true));
  it('returns false when no budget configured', () => expect(isIncident(0, 0, pct)).toBe(false));
  it('respects custom threshold percentage', () => {
    expect(isIncident(24_999, budget, 25)).toBe(true);
    expect(isIncident(25_001, budget, 25)).toBe(false);
  });
});

describe('getTrendDirection', () => {
  it('returns up when current is more than 5% higher', () => {
    expect(getTrendDirection(110, 100)).toBe('up');
  });
  it('returns down when current is more than 5% lower', () => {
    expect(getTrendDirection(90, 100)).toBe('down');
  });
  it('returns flat when within 5% up', () => {
    expect(getTrendDirection(103, 100)).toBe('flat');
  });
  it('returns flat when within 5% down', () => {
    expect(getTrendDirection(97, 100)).toBe('flat');
  });
  it('returns flat when previous is 0', () => {
    expect(getTrendDirection(100, 0)).toBe('flat');
  });
  it('returns flat when both are 0', () => {
    expect(getTrendDirection(0, 0)).toBe('flat');
  });
  it('returns up at exactly 5.1% difference', () => {
    expect(getTrendDirection(105.1, 100)).toBe('up');
  });
});

describe('getDailySpendSeries', () => {
  it('returns correct number of days', () => {
    expect(getDailySpendSeries([], 7)).toHaveLength(7);
    expect(getDailySpendSeries([], 30)).toHaveLength(30);
  });
  it('returns zero amounts when no expenses', () => {
    const series = getDailySpendSeries([], 7);
    series.forEach((s) => expect(s.amount).toBe(0));
  });
  it('aggregates spend for today', () => {
    const today = new Date().toISOString().slice(0, 10);
    const expenses = [mkExp(today, 50), mkExp(today, 75)];
    const series = getDailySpendSeries(expenses, 1);
    expect(series[0].amount).toBe(125);
  });
  it('each entry has a date string', () => {
    const series = getDailySpendSeries([], 3);
    series.forEach((s) => expect(s.date).toMatch(/^\d{4}-\d{2}-\d{2}$/));
  });
  it('dates are in ascending order', () => {
    const series = getDailySpendSeries([], 5);
    for (let i = 1; i < series.length; i++) {
      expect(series[i].date >= series[i - 1].date).toBe(true);
    }
  });
});

describe('getCategorySpend', () => {
  it('groups by category', () => {
    const expenses: Expense[] = [
      mkExp('2024-01-01', 100, 'food'),
      mkExp('2024-01-02', 50, 'transport'),
      mkExp('2024-01-03', 25, 'food'),
    ];
    const result = getCategorySpend(expenses);
    expect(result['food']).toBe(125);
    expect(result['transport']).toBe(50);
    expect(result['entertainment']).toBeUndefined();
  });
  it('returns empty object for no expenses', () => {
    expect(getCategorySpend([])).toEqual({});
  });
  it('handles all categories', () => {
    const expenses: Expense[] = [
      mkExp('2024-01-01', 10, 'food'),
      mkExp('2024-01-01', 20, 'transport'),
      mkExp('2024-01-01', 30, 'entertainment'),
      mkExp('2024-01-01', 40, 'home'),
      mkExp('2024-01-01', 50, 'others'),
      mkExp('2024-01-01', 60, 'education'),
    ];
    const result = getCategorySpend(expenses);
    expect(result['food']).toBe(10);
    expect(result['transport']).toBe(20);
    expect(result['entertainment']).toBe(30);
    expect(result['home']).toBe(40);
    expect(result['others']).toBe(50);
    expect(result['education']).toBe(60);
  });
});

describe('getDaysWithPositiveBudget', () => {
  it('counts days where spend is below daily budget', () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    // daily budget = 3000 / 31 ≈ 96.77 per day; spend 50 → good day
    const d1 = `${year}-${month}-01`;
    const expenses = [mkExp(d1, 50)];
    const days = getDaysWithPositiveBudget(expenses, 3000);
    expect(days).toContain(1);
  });
  it('excludes days where spend meets or exceeds daily budget', () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const daysInMonth = new Date(year, today.getMonth() + 1, 0).getDate();
    const dailyBudget = 3000 / daysInMonth;
    const d1 = `${year}-${month}-01`;
    const expenses = [mkExp(d1, dailyBudget + 1)];
    const days = getDaysWithPositiveBudget(expenses, 3000);
    expect(days).not.toContain(1);
  });
  it('returns empty array for no expenses (days elapsed have 0 spend = good)', () => {
    // 0 spend per day < any positive daily budget → all elapsed days are good
    const days = getDaysWithPositiveBudget([], 1000);
    expect(days.length).toBe(new Date().getDate());
  });
  it('returns empty array when budget is zero', () => {
    const today = new Date().toISOString().slice(0, 10);
    const days = getDaysWithPositiveBudget([mkExp(today, 0)], 0);
    expect(days).toHaveLength(0);
  });
});

describe('getPositiveDays', () => {
  it('returns count matching getDaysWithPositiveBudget', () => {
    const today = new Date().toISOString().slice(0, 10);
    const expenses = [mkExp(today, 1)];
    expect(getPositiveDays(expenses, 1000)).toBe(getDaysWithPositiveBudget(expenses, 1000).length);
  });
});

describe('getSloPercentage', () => {
  it('returns value between 0 and 100', () => {
    const today = new Date().toISOString().slice(0, 10);
    const expenses = [mkExp(today, 100)];
    const slo = getSloPercentage(expenses, 10000);
    expect(slo).toBeGreaterThanOrEqual(0);
    expect(slo).toBeLessThanOrEqual(100);
  });
  it('returns 100 when budget is zero (unconfigured)', () => {
    expect(getSloPercentage([], 0)).toBe(100);
  });
});

describe('getCategoryDailySeries', () => {
  it('returns correct length', () => {
    expect(getCategoryDailySeries([], 'food', 7)).toHaveLength(7);
  });
  it('only counts matching category', () => {
    const today = new Date().toISOString().slice(0, 10);
    const expenses = [mkExp(today, 100, 'food'), mkExp(today, 50, 'transport')];
    const series = getCategoryDailySeries(expenses, 'food', 1);
    expect(series[0]).toBe(100);
  });
  it('returns zeros when no expenses for category', () => {
    const series = getCategoryDailySeries([], 'food', 5);
    series.forEach((v) => expect(v).toBe(0));
  });
});
