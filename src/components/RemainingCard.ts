import type { AppState } from '../state';
import { formatCurrency } from '../utils/format';

function trendArrow(direction: 'up' | 'down' | 'flat'): string {
  if (direction === 'up') return '<span class="trend-up" title="Spending increasing">↑</span>';
  if (direction === 'down') return '<span class="trend-down" title="Spending decreasing">↓</span>';
  return '<span class="trend-flat" title="Spending steady">→</span>';
}

function remainingColor(remaining: number, budget: number): string {
  if (budget === 0) return '';
  const pct = remaining / budget;
  if (pct < 0) return 'negative';
  if (pct < 0.2) return 'negative';
  if (pct < 0.4) return 'warning';
  return 'positive';
}

export function renderRemainingCard(state: AppState): string {
  const { remaining, trendDirection, settings } = state;
  const colorClass = remainingColor(remaining, settings.monthlyBudget);

  return `
    <div class="card card-wide">
      <div class="card-label">Remaining Budget</div>
      <div class="remaining-row">
        <span class="card-value card-value-lg mono ${colorClass}">${formatCurrency(remaining)}</span>
        ${trendArrow(trendDirection)}
      </div>
      <canvas
        id="sparkline-main"
        class="sparkline"
        width="240"
        height="48"
        aria-label="30-day spending trend"
      ></canvas>
      <div class="card-sub">Last 30 days spend trend</div>
    </div>
  `;
}
