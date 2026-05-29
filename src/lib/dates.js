// Lightweight date helpers — no external date library, everything ISO (YYYY-MM-DD).

export const MS_DAY = 24 * 60 * 60 * 1000;

/** Today as an ISO date string (local, date-only). */
export function todayISO() {
  return toISO(new Date());
}

/** Date -> 'YYYY-MM-DD' using local time. */
export function toISO(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse an ISO date string into a Date at local midnight. */
export function fromISO(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Whole-day difference a - b (positive when a is later). */
export function daysBetween(aISO, bISO) {
  const a = fromISO(aISO);
  const b = fromISO(bISO);
  if (!a || !b) return 0;
  return Math.round((a - b) / MS_DAY);
}

/** Days since the given ISO date relative to today (positive = in the past). */
export function daysAgo(iso) {
  if (!iso) return Infinity;
  return daysBetween(todayISO(), iso);
}

/** True when dueDate is strictly before today. */
export function isOverdue(iso) {
  if (!iso) return false;
  return daysBetween(iso, todayISO()) < 0;
}

export function addDays(iso, n) {
  const d = fromISO(iso) || new Date();
  d.setDate(d.getDate() + n);
  return toISO(d);
}

/** Friendly short label, e.g. '14 May'. */
export function shortDate(iso) {
  const d = fromISO(iso);
  if (!d) return '—';
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

/** Resolve a fuzzy/relative date phrase to ISO, best effort. Falls back to +7 days. */
export function resolveRelativeDate(phrase, base = todayISO()) {
  if (!phrase) return addDays(base, 7);
  const p = String(phrase).trim().toLowerCase();
  // Already ISO?
  if (/^\d{4}-\d{2}-\d{2}$/.test(p)) return p;
  if (p === 'today') return base;
  if (p === 'tomorrow') return addDays(base, 1);
  if (p === 'eod' || p === 'cob') return base;
  if (p.includes('next week')) return addDays(base, 7);
  if (p.includes('end of week') || p === 'eow' || p.includes('friday')) {
    const d = fromISO(base);
    const delta = (5 - d.getDay() + 7) % 7 || 7;
    return addDays(base, delta);
  }
  if (p.includes('end of month')) {
    const d = fromISO(base);
    return toISO(new Date(d.getFullYear(), d.getMonth() + 1, 0));
  }
  const inDays = p.match(/in (\d+) days?/);
  if (inDays) return addDays(base, Number(inDays[1]));
  const inWeeks = p.match(/in (\d+) weeks?/);
  if (inWeeks) return addDays(base, Number(inWeeks[1]) * 7);
  // Last resort
  return addDays(base, 7);
}
