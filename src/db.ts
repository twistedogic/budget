import Dexie, { type Table } from 'dexie';
import type { Expense, RecurringTemplate, Settings } from './types';

export class BudgetDB extends Dexie {
  expenses!: Table<Expense, number>;
  recurring!: Table<RecurringTemplate, number>;
  settings!: Table<Settings, number>;

  constructor() {
    super('budget-slo-db');
    this.version(1).stores({
      expenses: '++id, date, category, recurringId',
      recurring: '++id, frequency',
      settings: '++id',
    });
  }
}

export const db = new BudgetDB();

export async function loadSettings(): Promise<Settings> {
  const rows = await db.settings.toArray();
  if (rows.length > 0) return rows[0];
  const id = await db.settings.add({ monthlyBudget: 0 });
  return { id, monthlyBudget: 0 };
}

export async function saveMonthlyBudget(amount: number): Promise<void> {
  const rows = await db.settings.toArray();
  if (rows.length > 0) {
    await db.settings.update(rows[0].id!, { monthlyBudget: amount });
  } else {
    await db.settings.add({ monthlyBudget: amount });
  }
}

export async function addExpense(expense: Omit<Expense, 'id'>): Promise<number> {
  return db.expenses.add(expense as Expense);
}

export async function deleteExpense(id: number): Promise<void> {
  return db.expenses.delete(id);
}

export async function getExpensesForMonth(year: number, month: number): Promise<Expense[]> {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  return db.expenses.filter((e) => e.date.startsWith(prefix)).toArray();
}

export async function addRecurring(template: Omit<RecurringTemplate, 'id'>): Promise<number> {
  return db.recurring.add(template as RecurringTemplate);
}

export async function deleteRecurring(id: number): Promise<void> {
  return db.recurring.delete(id);
}

export async function getAllRecurring(): Promise<RecurringTemplate[]> {
  return db.recurring.toArray();
}

export async function updateRecurringLastGenerated(id: number, date: string): Promise<void> {
  await db.recurring.update(id, { lastGenerated: date });
}
