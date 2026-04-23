import type { AppState } from '../state';
import { CATEGORY_LABELS, CATEGORY_COLORS, CATEGORIES } from '../calculations';
import { formatCurrency, formatDate, escapeHtml } from '../utils/format';
import type { Expense } from '../types';

function categoryBadge(cat: string): string {
  const color = CATEGORY_COLORS[cat] ?? '#94a3b8';
  const label = CATEGORY_LABELS[cat] ?? cat;
  return `<span class="badge" style="background:${color}22; color:${color}; border:1px solid ${color}44">${label}</span>`;
}

function expenseRow(expense: Expense): string {
  return `
    <div class="expense-row" data-id="${expense.id}">
      <span class="expense-date text-muted">${formatDate(expense.date)}</span>
      ${categoryBadge(expense.category)}
      <span class="expense-note text-secondary">${escapeHtml(expense.note || '—')}</span>
      <span class="expense-amount mono">${formatCurrency(expense.amount)}</span>
      <button
        class="icon-btn delete-btn"
        data-action="delete-expense"
        data-id="${expense.id}"
        aria-label="Delete expense"
        title="Delete"
      >✕</button>
    </div>
  `;
}

export function renderExpenseLog(state: AppState): string {
  const { expenses, filterCategory } = state;

  const filtered = filterCategory
    ? expenses.filter((e) => e.category === filterCategory)
    : expenses;

  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  const filterOptions = [
    `<option value="">All categories</option>`,
    ...CATEGORIES.map(
      (c) =>
        `<option value="${c}" ${filterCategory === c ? 'selected' : ''}>${CATEGORY_LABELS[c]}</option>`,
    ),
  ].join('');

  const list =
    sorted.length === 0
      ? `<div class="empty-state">No expenses yet. Add your first expense below.</div>`
      : sorted.map(expenseRow).join('');

  return `
    <div class="card card-full">
      <div class="section-header">
        <div class="card-label">Expense Log</div>
        <div class="log-controls">
          <select class="select-sm" data-action="filter-category" aria-label="Filter by category">
            ${filterOptions}
          </select>
          <button class="btn-primary btn-sm" data-action="open-add-expense">+ Add Expense</button>
        </div>
      </div>
      <div class="expense-list" id="expense-list">
        ${list}
      </div>
    </div>
  `;
}
