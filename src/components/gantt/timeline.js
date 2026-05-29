// Timeline geometry for the Gantt: maps ISO dates <-> pixels.
import { fromISO, toISO, daysBetween, addDays, MS_DAY } from '../../lib/dates.js';

export const DAY_WIDTH = 16; // px per day
export const ROW_HEIGHT = 44;
export const PAD_DAYS = 7; // padding on each side of the data range

/** Build a timeline domain from a set of workstreams. */
export function buildDomain(workstreams) {
  const today = new Date();
  let min = today;
  let max = addDays(toISO(today), 30);
  max = fromISO(max);
  for (const w of workstreams) {
    const s = fromISO(w.startDate);
    const e = fromISO(w.endDate);
    if (s && s < min) min = s;
    if (e && e > max) max = e;
  }
  const start = addDays(toISO(min), -PAD_DAYS);
  const end = addDays(toISO(max), PAD_DAYS);
  const totalDays = Math.max(1, daysBetween(end, start));
  return { start, end, totalDays, width: totalDays * DAY_WIDTH };
}

export function dateToX(iso, domain) {
  return daysBetween(iso, domain.start) * DAY_WIDTH;
}

export function xToDate(x, domain) {
  const days = Math.round(x / DAY_WIDTH);
  return addDays(domain.start, days);
}

export function barGeometry(ws, domain) {
  const x = dateToX(ws.startDate, domain);
  const days = Math.max(1, daysBetween(ws.endDate, ws.startDate));
  const width = days * DAY_WIDTH;
  return { x, width, days };
}

/** Month tick marks across the domain for the timeline header. */
export function monthTicks(domain) {
  const ticks = [];
  const start = fromISO(domain.start);
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  // Advance to first month boundary at/after start.
  while (cursor < start) cursor.setMonth(cursor.getMonth() + 1);
  const end = fromISO(domain.end);
  while (cursor <= end) {
    const iso = toISO(cursor);
    ticks.push({
      iso,
      x: dateToX(iso, domain),
      label: cursor.toLocaleDateString('en-AU', { month: 'short', year: '2-digit' }),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return ticks;
}

/** Week (Monday) gridlines for subtle vertical guides. */
export function weekTicks(domain) {
  const ticks = [];
  const start = fromISO(domain.start);
  const cursor = new Date(start);
  // Advance to next Monday.
  while (cursor.getDay() !== 1) cursor.setDate(cursor.getDate() + 1);
  const end = fromISO(domain.end);
  while (cursor <= end) {
    const iso = toISO(cursor);
    ticks.push({ iso, x: dateToX(iso, domain) });
    cursor.setDate(cursor.getDate() + 7);
  }
  return ticks;
}

export function todayX(domain) {
  const iso = toISO(new Date());
  return dateToX(iso, domain);
}
