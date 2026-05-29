// Deterministic HVA scoring — used as a fallback when the AI is unavailable,
// and to provide the value/urgency inputs. Score = normalized(value) × urgency.
import { daysBetween, todayISO } from '../../lib/dates.js';

export function urgencyFactor(dueDate) {
  if (!dueDate) return 0.4; // no due date -> moderate
  const days = daysBetween(dueDate, todayISO()); // negative = overdue
  if (days < 0) return 1; // overdue -> max urgency
  if (days === 0) return 0.95;
  if (days <= 2) return 0.85;
  if (days <= 5) return 0.7;
  if (days <= 10) return 0.5;
  if (days <= 21) return 0.35;
  return 0.2;
}

/** Returns items decorated with a numeric score, sorted desc. */
export function scoreLocally(items) {
  const maxValue = Math.max(1, ...items.map((i) => i.value || 0));
  return items
    .map((i) => {
      const normValue = (i.value || 0) / maxValue;
      const score = normValue * urgencyFactor(i.dueDate);
      return { ...i, score };
    })
    .sort((a, b) => b.score - a.score);
}

export function localWhy(item) {
  const days = item.dueDate ? daysBetween(item.dueDate, todayISO()) : null;
  const bits = [];
  if (item.value) bits.push(`$${Math.round((item.value || 0) / 1000)}k workstream`);
  if (days === null) bits.push('no due date set');
  else if (days < 0) bits.push(`${Math.abs(days)}d overdue`);
  else if (days === 0) bits.push('due today');
  else bits.push(`due in ${days}d`);
  return bits.join(' · ');
}
