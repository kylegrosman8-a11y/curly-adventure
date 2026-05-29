// Workstream status: the 5-state RAG legend used in exec reporting.
export const STATUSES = {
  complete: { id: 'complete', label: 'Complete', short: 'Complete', color: '#2563eb' },
  will_meet: { id: 'will_meet', label: 'Will Meet', short: 'Will Meet', color: '#16a34a' },
  at_risk: { id: 'at_risk', label: 'At Risk', short: 'At Risk', color: '#d97706' },
  will_not_meet: { id: 'will_not_meet', label: 'Will Not Meet', short: "Won't Meet", color: '#dc2626' },
  not_started: { id: 'not_started', label: 'Not Started', short: 'Not Started', color: '#94a3b8' },
};

export const STATUS_ORDER = ['complete', 'will_meet', 'at_risk', 'will_not_meet', 'not_started'];

// Map the earlier 3-state model onto the new legend (for migrating old data).
export const LEGACY_STATUS = {
  on_track: 'will_meet',
  slipping: 'at_risk',
  blocked: 'will_not_meet',
};

export function normaliseStatus(status) {
  if (STATUSES[status]) return status;
  return LEGACY_STATUS[status] || 'not_started';
}

export function statusColor(status) {
  return (STATUSES[normaliseStatus(status)] || STATUSES.not_started).color;
}

export const ACTION_STATUSES = {
  open: { id: 'open', label: 'Open', color: '#243a63' },
  done: { id: 'done', label: 'Done', color: '#16a34a' },
  blocked: { id: 'blocked', label: 'Blocked', color: '#dc2626' },
};

export const STALE_DAYS = 10;

/** Format a $ value compactly, e.g. 920000 -> "$920k". */
export function formatValue(v) {
  if (!v && v !== 0) return '—';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`;
  if (v >= 1000) return `$${Math.round(v / 1000)}k`;
  return `$${v}`;
}
