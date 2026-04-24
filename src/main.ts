import {
  loadSettings,
  getExpensesForMonth,
  getAllRecurring,
  addExpense,
  updateRecurringLastGenerated,
} from './db';
import { setState, subscribe } from './state';
import { renderApp } from './ui';
import type { RecurringTemplate } from './types';

function firstOfMonthISO(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-01`;
}

async function processRecurring(templates: RecurringTemplate[]): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  for (const t of templates) {
    if (!t.id) continue;
    if (!isDue(t, t.lastGenerated, today)) continue;

    let expenseDate = today;
    let amount = t.amount;

    if (t.frequency === 'monthly') {
      expenseDate = firstOfMonthISO(year, month);
    } else if (t.frequency === 'yearly') {
      expenseDate = firstOfMonthISO(year, month);
      amount = Math.round((t.amount / 12) * 100) / 100;
    }

    await addExpense({
      amount,
      category: t.category,
      date: expenseDate,
      note: `Recurring: ${t.name}`,
      recurringId: t.id,
    });
    await updateRecurringLastGenerated(t.id, today);
  }
}

function isDue(t: RecurringTemplate, last: string | undefined, today: string): boolean {
  if (!last) return true; // never generated before
  const lastDate = new Date(last + 'T00:00:00');
  const todayDate = new Date(today + 'T00:00:00');
  if (t.frequency === 'daily') {
    return last < today;
  }
  if (t.frequency === 'weekly') {
    const diffMs = todayDate.getTime() - lastDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays >= 7;
  }
  if (t.frequency === 'monthly' || t.frequency === 'yearly') {
    return (
      lastDate.getMonth() !== todayDate.getMonth() ||
      lastDate.getFullYear() !== todayDate.getFullYear()
    );
  }
  return false;
}

async function init(): Promise<void> {
  const app = document.getElementById('app');
  if (!app) {
    console.error('No #app element found');
    return;
  }

  try {
    const settings = await loadSettings();
    const now = new Date();
    const recurring = await getAllRecurring();

    // Auto-generate overdue recurring expenses
    await processRecurring(recurring);

    const expenses = await getExpensesForMonth(now.getFullYear(), now.getMonth());
    const updatedRecurring = await getAllRecurring();

    setState({ settings, expenses, recurring: updatedRecurring });

    renderApp(app);

    // Re-render on state change
    subscribe(() => renderApp(app));
  } catch (err) {
    console.error('Failed to initialize app:', err);
    app.innerHTML = `
      <div style="padding:40px; text-align:center; color:#ef4444">
        <h2>Failed to load</h2>
        <p style="color:#94a3b8; margin-top:8px">${String(err)}</p>
      </div>
    `;
  }
}

void init();
