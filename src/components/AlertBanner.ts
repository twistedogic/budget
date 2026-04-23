import type { AppState } from '../state';
import { formatCurrency } from '../utils/format';

export function renderAlertBanner(state: AppState): string {
  if (!state.incident || state.incidentDismissed) return '';

  const remaining = state.remaining;
  const isNegative = remaining < 0;
  const cls = isNegative ? 'alert-banner alert-incident' : 'alert-banner alert-warning';
  const icon = isNegative ? '🚨' : '⚠️';
  const label = isNegative ? 'CRITICAL INCIDENT' : 'INCIDENT';

  return `
    <div class="${cls}" id="alert-banner">
      <span class="alert-text">
        ${icon} <strong>${label}:</strong> Budget critical — <span class="mono">${formatCurrency(remaining)}</span> remaining
      </span>
      <button class="alert-dismiss" data-action="dismiss-alert" aria-label="Dismiss alert">✕</button>
    </div>
  `;
}
