export type Category = 'food' | 'transport' | 'entertainment' | 'home_repair' | 'others';
export type Frequency = 'daily' | 'weekly' | 'monthly';

export interface Expense {
  id?: number;
  amount: number;
  category: Category;
  date: string; // YYYY-MM-DD
  note: string;
  recurringId?: number;
}

export interface RecurringTemplate {
  id?: number;
  name: string;
  amount: number;
  category: Category;
  frequency: Frequency;
  startDate: string; // YYYY-MM-DD
  lastGenerated?: string; // YYYY-MM-DD
}

export interface Settings {
  id?: number;
  monthlyBudget: number;
}
