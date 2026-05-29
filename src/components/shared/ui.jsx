import { initials } from '../../store/store.jsx';
import { STATUSES } from '../../lib/status.js';

export function Avatar({ name, size = 'md', title }) {
  const cls = size === 'sm' ? 'h-6 w-6 text-[10px]' : size === 'lg' ? 'h-10 w-10 text-sm' : 'h-8 w-8 text-xs';
  return (
    <span
      title={title || name}
      className={`inline-flex ${cls} items-center justify-center rounded-full bg-navy-100 font-semibold text-navy-800`}
    >
      {initials(name)}
    </span>
  );
}

export function StatusBadge({ status }) {
  const s = STATUSES[status] || STATUSES.on_track;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: `${s.color}1a`, color: s.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

export function StatusDot({ status }) {
  const s = STATUSES[status] || STATUSES.on_track;
  return <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: s.color }} title={s.label} />;
}

export function EmptyState({ title, hint, children }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-navy-100 bg-white/60 px-6 py-12 text-center">
      <p className="text-sm font-semibold text-navy-800">{title}</p>
      {hint && <p className="mt-1 max-w-md text-sm text-navy-700/70">{hint}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide = false }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-navy-900/40 p-4 sm:p-8" onMouseDown={onClose}>
      <div
        className={`card w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} animate-[fadeIn_.12s_ease-out]`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-navy-100 px-5 py-3">
          <h3 className="text-sm font-semibold text-navy-800">{title}</h3>
          <button onClick={onClose} className="rounded p-1 text-navy-700/60 hover:bg-navy-50 hover:text-navy-800" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
