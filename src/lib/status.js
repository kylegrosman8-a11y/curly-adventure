// RAG status metadata shared across views.
export const STATUSES = {
  on_track: { id: 'on_track', label: 'On track', short: 'On track', color: '#16a34a', dot: 'bg-rag-on' },
  slipping: { id: 'slipping', label: 'Slipping', short: 'Slipping', color: '#d97706', dot: 'bg-rag-slip' },
  blocked: { id: 'blocked', label: 'Blocked', short: 'Blocked', color: '#dc2626', dot: 'bg-rag-block' },
};

export const STATUS_ORDER = ['on_track', 'slipping', 'blocked'];

export function statusColor(status) {
  return (STATUSES[status] || STATUSES.on_track).color;
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
