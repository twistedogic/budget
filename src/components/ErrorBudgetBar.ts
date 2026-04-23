import type { AppState } from '../state';

export function renderErrorBudgetBar(state: AppState): string {
  const { remaining, settings } = state;
  const budget = settings.monthlyBudget;

  const rawPct = budget > 0 ? (remaining / budget) * 100 : 0;
  const pct = Math.max(0, Math.min(100, rawPct));

  let fillColor: string;
  let label: string;
  if (rawPct >= 40) {
    fillColor = '#22c55e';
    label = 'On track';
  } else if (rawPct >= 20) {
    fillColor = '#f59e0b';
    label = 'Caution';
  } else if (rawPct >= 0) {
    fillColor = '#ef4444';
    label = 'Critical';
  } else {
    fillColor = '#ef4444';
    label = 'Over budget';
  }

  return `
    <div class="card">
      <div class="card-label">Error Budget</div>
      <div class="error-budget-bar-wrap">
        <div class="error-budget-track" role="progressbar" aria-valuenow="${pct.toFixed(0)}" aria-valuemin="0" aria-valuemax="100">
          <div class="error-budget-fill" style="width:${pct.toFixed(1)}%; background:${fillColor};"></div>
          <!-- Threshold markers -->
          <div class="threshold-marker" style="left:20%" title="Critical threshold (20%)"></div>
          <div class="threshold-marker" style="left:40%" title="Caution threshold (40%)"></div>
        </div>
      </div>
      <div class="error-budget-meta">
        <span class="mono" style="color:${fillColor}">${pct.toFixed(1)}% remaining</span>
        <span class="badge" style="background:${fillColor}22; color:${fillColor}; border:1px solid ${fillColor}44">${label}</span>
      </div>
    </div>
  `;
}
