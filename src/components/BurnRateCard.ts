import type { AppState } from '../state';
import { formatCurrencyDecimal } from '../utils/format';

export function renderBurnRateCards(state: AppState): string {
  const { dailyBurnRate, weeklyBurnRate } = state;

  const dailyColor = dailyBurnRate > 0 ? '' : 'text-muted';
  const weeklyColor = weeklyBurnRate > 0 ? '' : 'text-muted';

  return `
    <div class="card">
      <div class="card-label">Daily Burn Rate</div>
      <div class="burn-row">
        <span class="burn-icon" aria-hidden="true">🔥</span>
        <span class="card-value mono ${dailyColor}">${formatCurrencyDecimal(Math.max(0, dailyBurnRate))}</span>
      </div>
      <div class="card-sub">spent today (excl. recurring)</div>
    </div>
    <div class="card">
      <div class="card-label">Weekly Burn Rate</div>
      <div class="burn-row">
        <span class="burn-icon" aria-hidden="true">📈</span>
        <span class="card-value mono ${weeklyColor}">${formatCurrencyDecimal(Math.max(0, weeklyBurnRate))}</span>
      </div>
      <div class="card-sub">avg daily / last 7 days (excl. recurring)</div>
    </div>
  `;
}
