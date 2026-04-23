import type { AppState } from '../state';
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_COLORS } from '../calculations';
import { formatCurrency } from '../utils/format';

export function renderCategorySparklines(state: AppState): string {
  const { categorySpend } = state;

  const rows = CATEGORIES.map((cat) => {
    const spend = categorySpend[cat] ?? 0;
    const color = CATEGORY_COLORS[cat];
    const label = CATEGORY_LABELS[cat];

    return `
      <div class="category-row">
        <div class="category-info">
          <span class="category-dot" style="background:${color}"></span>
          <span class="category-name">${label}</span>
        </div>
        <canvas
          id="sparkline-cat-${cat}"
          class="sparkline sparkline-sm"
          data-category="${cat}"
          width="80"
          height="24"
          aria-label="${label} spending trend"
        ></canvas>
        <span class="category-amount mono">${formatCurrency(spend)}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="card card-full">
      <div class="card-label">Monthly Spend by Category</div>
      <div class="category-list">
        ${rows}
      </div>
    </div>
  `;
}
