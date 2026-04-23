import { CATEGORIES, CATEGORY_LABELS } from '../calculations';
import { todayISO } from '../utils/format';

export function renderAddExpenseModal(): string {
  const categoryOptions = CATEGORIES.map(
    (c) => `<option value="${c}">${CATEGORY_LABELS[c]}</option>`,
  ).join('');

  return `
    <div class="modal-backdrop hidden" id="add-expense-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-box">
        <div class="modal-header">
          <h2 id="modal-title">Add Expense</h2>
          <button class="icon-btn" data-action="close-add-expense" aria-label="Close modal">✕</button>
        </div>
        <form id="add-expense-form" novalidate>
          <div class="form-group">
            <label for="exp-amount">Amount ($)</label>
            <input
              type="number"
              id="exp-amount"
              class="input mono"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              required
              autocomplete="off"
            />
          </div>
          <div class="form-group">
            <label for="exp-category">Category</label>
            <select id="exp-category" class="input">
              ${categoryOptions}
            </select>
          </div>
          <div class="form-group">
            <label for="exp-date">Date</label>
            <input
              type="date"
              id="exp-date"
              class="input"
              value="${todayISO()}"
              required
            />
          </div>
          <div class="form-group">
            <label for="exp-note">Note <span class="text-muted">(optional)</span></label>
            <input
              type="text"
              id="exp-note"
              class="input"
              placeholder="e.g. Grocery run"
              maxlength="120"
            />
          </div>
          <div id="expense-form-error" class="form-error hidden"></div>
          <div class="modal-footer">
            <button type="button" class="btn-ghost" data-action="close-add-expense">Cancel</button>
            <button type="submit" class="btn-primary">Add Expense</button>
          </div>
        </form>
      </div>
    </div>
  `;
}
