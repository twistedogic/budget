import type { AppState } from '../state';
import type { RecurringTemplate } from '../types';
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_COLORS } from '../calculations';
import { formatCurrency, escapeHtml } from '../utils/format';
import { todayISO } from '../utils/format';

function frequencyLabel(f: string): string {
  return f.charAt(0).toUpperCase() + f.slice(1);
}

function recurringRow(t: RecurringTemplate): string {
  const color = CATEGORY_COLORS[t.category] ?? '#94a3b8';
  const catLabel = CATEGORY_LABELS[t.category] ?? t.category;
  return `
    <div class="expense-row" data-id="${t.id}">
      <span class="expense-note">${escapeHtml(t.name)}</span>
      <span class="badge" style="background:${color}22; color:${color}; border:1px solid ${color}44">${catLabel}</span>
      <span class="text-muted">${frequencyLabel(t.frequency)}</span>
      <span class="expense-amount mono">${formatCurrency(t.amount)}</span>
      <button
        class="icon-btn delete-btn"
        data-action="delete-recurring"
        data-id="${t.id}"
        aria-label="Delete recurring"
        title="Delete"
      >✕</button>
    </div>
  `;
}

function addRecurringModal(): string {
  const categoryOptions = CATEGORIES.map(
    (c) => `<option value="${c}">${CATEGORY_LABELS[c]}</option>`,
  ).join('');

  return `
    <div class="modal-backdrop hidden" id="add-recurring-modal" role="dialog" aria-modal="true" aria-labelledby="rec-modal-title">
      <div class="modal-box">
        <div class="modal-header">
          <h2 id="rec-modal-title">Add Recurring Expense</h2>
          <button class="icon-btn" data-action="close-add-recurring" aria-label="Close modal">✕</button>
        </div>
        <form id="add-recurring-form" novalidate>
          <div class="form-group">
            <label for="rec-name">Name</label>
            <input
              type="text"
              id="rec-name"
              class="input"
              placeholder="e.g. Netflix, Rent"
              required
              maxlength="80"
            />
          </div>
          <div class="form-group">
            <label for="rec-amount">Amount ($)</label>
            <input
              type="number"
              id="rec-amount"
              class="input mono"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              required
            />
          </div>
          <div class="form-group">
            <label for="rec-category">Category</label>
            <select id="rec-category" class="input">
              ${categoryOptions}
            </select>
          </div>
          <div class="form-group">
            <label for="rec-frequency">Frequency</label>
            <select id="rec-frequency" class="input">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly" selected>Monthly</option>
            </select>
          </div>
          <div class="form-group">
            <label for="rec-start">Start Date</label>
            <input type="date" id="rec-start" class="input" value="${todayISO()}" required />
          </div>
          <div id="recurring-form-error" class="form-error hidden"></div>
          <div class="modal-footer">
            <button type="button" class="btn-ghost" data-action="close-add-recurring">Cancel</button>
            <button type="submit" class="btn-primary">Add Recurring</button>
          </div>
        </form>
      </div>
    </div>
  `;
}

export function renderRecurringPanel(state: AppState): string {
  const { recurring } = state;

  const list =
    recurring.length === 0
      ? `<div class="empty-state">No recurring expenses. Add one below.</div>`
      : recurring.map(recurringRow).join('');

  return `
    ${addRecurringModal()}
    <div class="card card-full">
      <div class="section-header">
        <div class="card-label">Recurring Expenses</div>
        <button class="btn-primary btn-sm" data-action="open-add-recurring">+ Add Recurring</button>
      </div>
      <div class="expense-list">
        ${list}
      </div>
    </div>
  `;
}
