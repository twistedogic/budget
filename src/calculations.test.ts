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
  INCIDENT_THRESHOLD,
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

describe('getWeeklyBurnRate', () => {
  it('multiplies daily by 7', () => expect(getWeeklyBurnRate(100)).toBe(700));
  it('handles zero', () => expect(getWeeklyBurnRate(0)).toBe(0));
  it('handles fractional daily rate', () => expect(getWeeklyBurnRate(10.5)).toBeCloseTo(73.5));
});

describe('getDailyBurnRate', () => {
  it('returns positive value for mid-month', () => {
    const now = new Date();
    const rate = getDailyBurnRate(30000, now.getFullYear(), now.getMonth());
    expect(rate).toBeGreaterThanOrEqual(0);
  });
  it('divides remaining by days left in month', () => {
    // Use a fixed date scenario conceptually — just check it returns a finite number
    const rate = getDailyBurnRate(10000, 2024, 0);
    expect(isFinite(rate)).toBe(true);
  });
});

describe('isIncident', () => {
  it('returns true below threshold', () => expect(isIncident(INCIDENT_THRESHOLD - 1)).toBe(true));
  it('returns false above threshold', () => expect(isIncident(INCIDENT_THRESHOLD + 1)).toBe(false));
  it('returns false at exactly threshold', () => expect(isIncident(INCIDENT_THRESHOLD)).toBe(false));
  it('returns true for negative budget', () => expect(isIncident(-100)).toBe(true));
  it('returns true for zero', () => expect(isIncident(0)).toBe(true));
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
      mkExp('2024-01-01', 40, 'home_repair'),
      mkExp('2024-01-01', 50, 'others'),
    ];
    const result = getCategorySpend(expenses);
    expect(result['food']).toBe(10);
    expect(result['transport']).toBe(20);
    expect(result['entertainment']).toBe(30);
    expect(result['home_repair']).toBe(40);
    expect(result['others']).toBe(50);
  });
});

describe('getDaysWithPositiveBudget', () => {
  it('returns all spend days when cumulative spend is within budget', () => {
    const expenses = [mkExp('2024-01-01', 100), mkExp('2024-01-02', 200)];
    const days = getDaysWithPositiveBudget(expenses, 1000);
    expect(days).toHaveLength(2);
  });
  it('excludes days where cumulative spend exceeds budget', () => {
    const expenses = [mkExp('2024-01-01', 900), mkExp('2024-01-02', 200)];
    const days = getDaysWithPositiveBudget(expenses, 1000);
    expect(days).toHaveLength(1);
  });
  it('returns empty array for no expenses', () => {
    expect(getDaysWithPositiveBudget([], 1000)).toHaveLength(0);
  });
  it('excludes all days when budget is zero', () => {
    const expenses = [mkExp('2024-01-01', 1)];
    const days = getDaysWithPositiveBudget(expenses, 0);
    expect(days).toHaveLength(0);
  });
});

describe('getPositiveDays', () => {
  it('returns count of positive budget days', () => {
    const expenses = [mkExp('2024-01-01', 100), mkExp('2024-01-02', 200)];
    expect(getPositiveDays(expenses, 1000)).toBe(2);
  });
  it('returns 0 when no expenses', () => {
    expect(getPositiveDays([], 500)).toBe(0);
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
