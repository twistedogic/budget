import type { AppState } from '../state';

function sloColor(pct: number): string {
  if (pct >= 85) return '#22c55e';
  if (pct >= 70) return '#f59e0b';
  return '#ef4444';
}

export function renderSloMeter(state: AppState): string {
  const pct = Math.max(0, Math.min(100, state.sloPercentage));
  const color = sloColor(pct);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);
  const label = pct >= 85 ? 'Healthy' : pct >= 70 ? 'Degraded' : 'Critical';

  return `
    <div class="card card-center">
      <div class="card-label">SLO Reliability</div>
      <div class="slo-meter-wrap">
        <svg width="100" height="100" viewBox="0 0 100 100" aria-label="SLO meter ${pct.toFixed(1)}%">
          <!-- Track -->
          <circle
            cx="50" cy="50" r="${radius}"
            fill="none"
            stroke="#2a2d3a"
            stroke-width="10"
          />
          <!-- Progress -->
          <circle
            cx="50" cy="50" r="${radius}"
            fill="none"
            stroke="${color}"
            stroke-width="10"
            stroke-linecap="round"
            stroke-dasharray="${circumference.toFixed(2)}"
            stroke-dashoffset="${offset.toFixed(2)}"
            transform="rotate(-90 50 50)"
            style="transition: stroke-dashoffset 0.4s ease;"
          />
          <text x="50" y="46" text-anchor="middle" fill="${color}" font-size="14" font-weight="600" font-family="ui-monospace, monospace">
            ${pct.toFixed(1)}%
          </text>
          <text x="50" y="60" text-anchor="middle" fill="#94a3b8" font-size="8" font-family="ui-sans-serif, sans-serif">
            ${label}
          </text>
        </svg>
      </div>
      <div class="card-sub">Positive-budget days this month</div>
    </div>
  `;
}
