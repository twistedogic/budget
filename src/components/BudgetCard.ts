import type { AppState } from '../state';
import { formatCurrency } from '../utils/format';

export function renderBudgetCard(state: AppState): string {
  const budget = state.settings.monthlyBudget;

  return `
    <div class="card">
      <div class="card-label">Monthly Budget</div>
      <div class="budget-display" id="budget-display">
        <span class="card-value mono" id="budget-value">${formatCurrency(budget)}</span>
        <button class="icon-btn edit-btn" data-action="edit-budget" aria-label="Edit budget" title="Edit budget">✎</button>
      </div>
      <div class="budget-edit hidden" id="budget-edit">
        <input
          type="number"
          id="budget-input"
          class="budget-input mono"
          value="${budget}"
          min="0"
          step="100"
          placeholder="Enter monthly budget"
        />
        <button class="btn-primary btn-sm" data-action="save-budget">Save</button>
        <button class="btn-ghost btn-sm" data-action="cancel-budget">Cancel</button>
      </div>
      <div class="card-sub">Set your monthly spending limit</div>
    </div>
  `;
}
