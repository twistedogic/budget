import { state, setState } from './state';
import { renderAlertBanner } from './components/AlertBanner';
import { renderRemainingCard } from './components/RemainingCard';
import { renderBurnRateCards } from './components/BurnRateCard';
import { renderSloMeter } from './components/SloMeter';
import { renderErrorBudgetBar } from './components/ErrorBudgetBar';
import { renderCategorySparklines } from './components/CategorySparklines';
import { renderExpenseLog } from './components/ExpenseLog';
import { renderAddExpenseModal } from './components/AddExpenseModal';
import { renderRecurringPanel } from './components/RecurringPanel';
import { renderSettingsPanel } from './components/SettingsPanel';
import { drawSparkline } from './utils/sparkline';
import { todayISO } from './utils/format';
import { getCategoryDailySeries, CATEGORIES, CATEGORY_COLORS } from './calculations';
import {
  saveMonthlyBudget,
  addExpense,
  deleteExpense,
  addRecurring,
  deleteRecurring,
  getExpensesForMonth,
  getAllRecurring,
  saveIncidentThreshold,
} from './db';
import type { Category, Frequency } from './types';

export function renderApp(el: HTMLElement): void {
  el.innerHTML = buildHTML();
  attachEvents(el);
  drawAllSparklines();
}

function buildHTML(): string {
  const s = state;
  return `
    ${renderAlertBanner(s)}
    <header class="app-header">
      <div>
        <h1 class="app-title">Budget SLO Dashboard</h1>
        <p class="app-subtitle">Your personal finance reliability tracker</p>
      </div>
      <button class="btn-ghost btn-settings" data-action="open-settings" aria-label="Open settings">
        ⚙ Settings
      </button>
    </header>

    <div class="mt-section">
      ${renderRemainingCard(s)}
    </div>

    <div class="grid-2 mt-cards">
      ${renderBurnRateCards(s)}
    </div>

    <div class="grid-2 mt-cards">
      ${renderSloMeter(s)}
      ${renderErrorBudgetBar(s)}
    </div>

    <div class="mt-section">
      ${renderCategorySparklines(s)}
    </div>

    <div class="mt-section">
      ${renderExpenseLog(s)}
    </div>

    <div class="mt-section">
      ${renderRecurringPanel(s)}
    </div>

    ${renderAddExpenseModal()}
    ${renderSettingsPanel(s)}
  `;
}

function drawAllSparklines(): void {
  // Main 30-day sparkline
  const mainCanvas = document.getElementById('sparkline-main') as HTMLCanvasElement | null;
  if (mainCanvas) {
    const data = state.dailySeries.map((d) => d.amount);
    drawSparkline(mainCanvas, data, '#f59e0b');
  }

  // Per-category sparklines
  for (const cat of CATEGORIES) {
    const canvas = document.getElementById(`sparkline-cat-${cat}`) as HTMLCanvasElement | null;
    if (canvas) {
      const data = getCategoryDailySeries(state.expenses, cat, 30);
      const color = CATEGORY_COLORS[cat] ?? '#94a3b8';
      drawSparkline(canvas, data, color);
    }
  }
}

function attachEvents(el: HTMLElement): void {
  el.addEventListener('click', handleClick);
  el.addEventListener('change', handleChange);
  el.addEventListener('submit', handleSubmit);

  // Close modals on backdrop click
  const expModal = el.querySelector<HTMLElement>('#add-expense-modal');
  if (expModal) {
    expModal.addEventListener('click', (e) => {
      if (e.target === expModal) closeAddExpenseModal();
    });
  }
  const recModal = el.querySelector<HTMLElement>('#add-recurring-modal');
  if (recModal) {
    recModal.addEventListener('click', (e) => {
      if (e.target === recModal) closeAddRecurringModal();
    });
  }

  const settingsModal = el.querySelector<HTMLElement>('#settings-modal');
  if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
      if (e.target === settingsModal) closeSettingsPanel();
    });
  }

  const settingsBudgetInput = el.querySelector<HTMLInputElement>('#settings-budget-input');
  if (settingsBudgetInput) {
    settingsBudgetInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveSettingsBudget();
      if (e.key === 'Escape') closeSettingsPanel();
    });
  }

  const settingsThresholdInput = el.querySelector<HTMLInputElement>('#settings-threshold-input');
  if (settingsThresholdInput) {
    settingsThresholdInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveSettingsThreshold();
      if (e.key === 'Escape') closeSettingsPanel();
    });
  }

  // Global ESC key to close modals
  document.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Escape') {
        closeAddExpenseModal();
        closeAddRecurringModal();
        closeSettingsPanel();
      }
    },
    { once: true },
  );
}

function handleClick(e: Event): void {
  const target = e.target as HTMLElement;
  const action = target.closest('[data-action]')?.getAttribute('data-action');
  if (!action) return;

  switch (action) {
    case 'dismiss-alert':
      setState({ incidentDismissed: true });
      break;

    case 'open-settings':
      openSettingsPanel();
      break;

    case 'save-settings-threshold':
      saveSettingsThreshold();
      break;

    case 'close-settings':
      closeSettingsPanel();
      break;

    case 'save-settings-budget':
      saveSettingsBudget();
      break;

    case 'open-add-expense':
      openAddExpenseModal();
      break;

    case 'close-add-expense':
      closeAddExpenseModal();
      break;

    case 'delete-expense': {
      const id = Number((target.closest('[data-id]') as HTMLElement)?.dataset.id);
      if (id) void handleDeleteExpense(id);
      break;
    }

    case 'open-add-recurring':
      openAddRecurringModal();
      break;

    case 'close-add-recurring':
      closeAddRecurringModal();
      break;

    case 'delete-recurring': {
      const id = Number((target.closest('[data-id]') as HTMLElement)?.dataset.id);
      if (id) void handleDeleteRecurring(id);
      break;
    }

    case 'export-csv':
      exportExpensesCsv();
      break;
  }
}

function handleChange(e: Event): void {
  const target = e.target as HTMLElement;
  const action = target.getAttribute('data-action');
  if (!action) return;

  if (action === 'filter-category') {
    const val = (target as HTMLSelectElement).value;
    setState({ filterCategory: val });
  }
}

function handleSubmit(e: Event): void {
  const form = e.target as HTMLFormElement;
  e.preventDefault();

  if (form.id === 'add-expense-form') {
    void handleAddExpense(form);
  } else if (form.id === 'add-recurring-form') {
    void handleAddRecurring(form);
  }
}

// ----- CSV export -----

function exportExpensesCsv(): void {
  const { expenses, filterCategory } = state;
  const filtered = filterCategory
    ? expenses.filter((e) => e.category === filterCategory)
    : expenses;
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  const rows = [
    ['Date', 'Category', 'Note', 'Amount'],
    ...sorted.map((e) => [
      e.date,
      e.category,
      `"${e.note.replace(/"/g, '""')}"`,
      e.amount.toFixed(2),
    ]),
  ];

  const csv = rows.map((r) => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const now = new Date();
  a.href = url;
  a.download = `expenses-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ----- Settings panel -----

function openSettingsPanel(): void {
  const modal = document.getElementById('settings-modal');
  if (modal) {
    modal.classList.remove('hidden');
    document.getElementById('settings-budget-input')?.focus();
  }
}

function closeSettingsPanel(): void {
  const modal = document.getElementById('settings-modal');
  if (modal) {
    modal.classList.add('hidden');
    hideFormError(document.getElementById('settings-budget-error'));
  }
}

function saveSettingsBudget(): void {
  const input = document.getElementById('settings-budget-input') as HTMLInputElement | null;
  const errorEl = document.getElementById('settings-budget-error');
  if (!input) return;

  const val = parseFloat(input.value);
  if (isNaN(val) || val < 0) {
    showFormError(errorEl, 'Please enter a valid budget amount (0 or greater).');
    return;
  }

  void (async () => {
    await saveMonthlyBudget(val);
    const now = new Date();
    const expenses = await getExpensesForMonth(now.getFullYear(), now.getMonth());
    setState({
      settings: { ...state.settings, monthlyBudget: val },
      expenses,
    });
    closeSettingsPanel();
  })();
}

function saveSettingsThreshold(): void {
  const input = document.getElementById('settings-threshold-input') as HTMLInputElement | null;
  const errorEl = document.getElementById('settings-threshold-error');
  if (!input) return;

  const val = parseFloat(input.value);
  if (isNaN(val) || val < 1 || val > 100) {
    showFormError(errorEl, 'Please enter a percentage between 1 and 100.');
    return;
  }

  void (async () => {
    await saveIncidentThreshold(val);
    setState({
      settings: { ...state.settings, incidentThresholdPct: val },
    });
    closeSettingsPanel();
  })();
}

// ----- Expense actions -----

async function handleAddExpense(form: HTMLFormElement): Promise<void> {
  const amountEl = form.querySelector<HTMLInputElement>('#exp-amount');
  const categoryEl = form.querySelector<HTMLSelectElement>('#exp-category');
  const dateEl = form.querySelector<HTMLInputElement>('#exp-date');
  const noteEl = form.querySelector<HTMLInputElement>('#exp-note');
  const errorEl = form.querySelector<HTMLElement>('#expense-form-error');

  const amount = parseFloat(amountEl?.value ?? '');
  const category = (categoryEl?.value ?? 'others') as Category;
  const date = dateEl?.value ?? '';
  const note = noteEl?.value?.trim() ?? '';

  if (isNaN(amount) || amount <= 0) {
    showFormError(errorEl, 'Please enter a valid amount greater than 0.');
    return;
  }
  if (!date) {
    showFormError(errorEl, 'Please select a date.');
    return;
  }

  await addExpense({ amount, category, date, note });
  const now = new Date();
  const expenses = await getExpensesForMonth(now.getFullYear(), now.getMonth());
  setState({ expenses, incidentDismissed: false });
  closeAddExpenseModal();
}

async function handleDeleteExpense(id: number): Promise<void> {
  await deleteExpense(id);
  const now = new Date();
  const expenses = await getExpensesForMonth(now.getFullYear(), now.getMonth());
  setState({ expenses });
}

// ----- Recurring actions -----

async function handleAddRecurring(form: HTMLFormElement): Promise<void> {
  const nameEl = form.querySelector<HTMLInputElement>('#rec-name');
  const amountEl = form.querySelector<HTMLInputElement>('#rec-amount');
  const categoryEl = form.querySelector<HTMLSelectElement>('#rec-category');
  const freqEl = form.querySelector<HTMLSelectElement>('#rec-frequency');
  const errorEl = form.querySelector<HTMLElement>('#recurring-form-error');

  const name = nameEl?.value?.trim() ?? '';
  const amount = parseFloat(amountEl?.value ?? '');
  const category = (categoryEl?.value ?? 'others') as Category;
  const frequency = (freqEl?.value ?? 'monthly') as Frequency;
  const startDate = todayISO();

  if (!name) {
    showFormError(errorEl, 'Please enter a name.');
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    showFormError(errorEl, 'Please enter a valid amount.');
    return;
  }

  await addRecurring({ name, amount, category, frequency, startDate });
  const recurring = await getAllRecurring();
  setState({ recurring });
  closeAddRecurringModal();
}

async function handleDeleteRecurring(id: number): Promise<void> {
  await deleteRecurring(id);
  const recurring = await getAllRecurring();
  setState({ recurring });
}

// ----- Modal helpers -----

function openAddExpenseModal(): void {
  const modal = document.getElementById('add-expense-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.querySelector<HTMLInputElement>('#exp-amount')?.focus();
  }
}

function closeAddExpenseModal(): void {
  const modal = document.getElementById('add-expense-modal');
  if (modal) {
    modal.classList.add('hidden');
    const form = modal.querySelector<HTMLFormElement>('#add-expense-form');
    form?.reset();
    hideFormError(modal.querySelector<HTMLElement>('#expense-form-error'));
  }
}

function openAddRecurringModal(): void {
  const modal = document.getElementById('add-recurring-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.querySelector<HTMLInputElement>('#rec-name')?.focus();
  }
}

function closeAddRecurringModal(): void {
  const modal = document.getElementById('add-recurring-modal');
  if (modal) {
    modal.classList.add('hidden');
    const form = modal.querySelector<HTMLFormElement>('#add-recurring-form');
    form?.reset();
    hideFormError(modal.querySelector<HTMLElement>('#recurring-form-error'));
  }
}

function showFormError(el: HTMLElement | null, message: string): void {
  if (!el) return;
  el.textContent = message;
  el.classList.remove('hidden');
}

function hideFormError(el: HTMLElement | null): void {
  if (!el) return;
  el.textContent = '';
  el.classList.add('hidden');
}
