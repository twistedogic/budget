import type { AppState } from '../state';
import { formatCurrency } from '../utils/format';

export function renderSettingsPanel(state: AppState): string {
  const budget = state.settings.monthlyBudget;
  const thresholdPct = state.settings.incidentThresholdPct ?? 10;

  return `
    <div class="modal-backdrop hidden" id="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div class="modal-box settings-modal-box">

        <div class="modal-header">
          <h2 id="settings-title">⚙ Settings</h2>
          <button class="icon-btn" data-action="close-settings" aria-label="Close settings">✕</button>
        </div>

        <!-- Monthly Budget section -->
        <section class="settings-section">
          <div class="settings-section-header">
            <span class="settings-section-icon">💰</span>
            <div>
              <div class="settings-section-title">Monthly Budget</div>
              <div class="settings-section-desc">
                Your total spending limit for the current month. SLO calculations,
                burn rates, and incident alerts are all based on this value.
              </div>
            </div>
          </div>

          <div class="settings-current-row">
            <span class="settings-label">Current budget</span>
            <span class="settings-current-value mono" id="settings-current-display">${formatCurrency(budget)}</span>
          </div>

          <div class="settings-input-row" id="settings-budget-edit-row">
            <div class="settings-input-wrap">
              <span class="settings-input-prefix">$</span>
              <input
                type="number"
                id="settings-budget-input"
                class="budget-input mono settings-budget-input"
                value="${budget > 0 ? budget : ''}"
                min="0"
                step="100"
                placeholder="e.g. 5000"
                aria-label="Monthly budget amount"
              />
            </div>
            <button class="btn-primary" data-action="save-settings-budget">Save</button>
          </div>

          <p class="form-error hidden" id="settings-budget-error"></p>

          <p class="settings-hint">
            Tip: set your budget once and it persists across sessions.
          </p>
        </section>

        <!-- Incident Threshold section -->
        <section class="settings-section">
          <div class="settings-section-header">
            <span class="settings-section-icon">🚨</span>
            <div>
              <div class="settings-section-title">Incident Threshold</div>
              <div class="settings-section-desc">
                An incident alert fires when remaining budget drops below this percentage of your monthly budget.
              </div>
            </div>
          </div>

          <div class="settings-input-row">
            <div class="settings-input-wrap">
              <input
                type="number"
                id="settings-threshold-input"
                class="budget-input mono settings-budget-input"
                value="${thresholdPct}"
                min="1"
                max="100"
                step="1"
                placeholder="10"
                aria-label="Incident threshold percentage"
              />
              <span class="settings-input-prefix">%</span>
            </div>
            <button class="btn-primary" data-action="save-settings-threshold">Save</button>
          </div>

          <p class="form-error hidden" id="settings-threshold-error"></p>
        </section>

      </div>
    </div>
  `;
}
