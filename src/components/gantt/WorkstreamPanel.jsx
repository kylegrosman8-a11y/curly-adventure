import { useState } from 'react';
import { useStore, useLookups } from '../../store/store.jsx';
import { StatusBadge, Avatar } from '../shared/ui.jsx';
import { STATUS_ORDER, STATUSES, ACTION_STATUSES, formatValue } from '../../lib/status.js';
import { shortDate, daysAgo, isOverdue, addDays, todayISO } from '../../lib/dates.js';

// Slide-over detail panel: full workstream detail, notes timeline, action items.
export default function WorkstreamPanel({ workstreamId, onClose }) {
  const store = useStore();
  const { accountById, memberById } = useLookups();
  const ws = store.workstreams.find((w) => w.id === workstreamId);
  const [noteText, setNoteText] = useState('');
  const [newAction, setNewAction] = useState('');

  if (!ws) return null;
  const account = accountById.get(ws.accountId);
  const owner = memberById.get(ws.ownerId);
  const notes = store.notes
    .filter((n) => n.workstreamId === ws.id)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const actions = store.actionItems.filter((a) => a.workstreamId === ws.id);

  return (
    <aside className="flex h-full w-[420px] flex-shrink-0 flex-col border-l border-navy-100 bg-white">
      <div className="flex items-start justify-between border-b border-navy-100 px-5 py-3" style={{ borderTopColor: account?.color }}>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-700/60">{account?.name}</p>
          <h2 className="truncate text-base font-semibold text-navy-800">{ws.title}</h2>
        </div>
        <button onClick={onClose} className="rounded p-1 text-navy-700/60 hover:bg-navy-50" aria-label="Close panel">
          ✕
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
        {/* Status + meta */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Field label="Owner">
            <span className="inline-flex items-center gap-2">
              <Avatar name={owner?.name} size="sm" /> {owner?.name || '—'}
            </span>
          </Field>
          <Field label="Status">
            <StatusBadge status={ws.status} />
          </Field>
          <Field label="Est. value">{formatValue(ws.value)}</Field>
          <Field label="Last touched">
            <span className={daysAgo(ws.lastTouched) > 10 ? 'font-medium text-red-600' : ''}>
              {shortDate(ws.lastTouched)} · {daysAgo(ws.lastTouched)}d ago
            </span>
          </Field>
          <Field label="Start">{shortDate(ws.startDate)}</Field>
          <Field label="End">{shortDate(ws.endDate)}</Field>
        </div>

        {/* Status quick set */}
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-navy-700/60">Set status</p>
          <div className="flex gap-2">
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                onClick={() => store.updateWorkstream(ws.id, { status: s }, { touch: true })}
                className="flex-1 rounded-md border px-2 py-1.5 text-xs font-medium transition-colors"
                style={
                  ws.status === s
                    ? { background: STATUSES[s].color, borderColor: STATUSES[s].color, color: '#fff' }
                    : { borderColor: '#dce3ef', color: STATUSES[s].color }
                }
              >
                {STATUSES[s].label}
              </button>
            ))}
          </div>
        </div>

        {/* % complete */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-700/60">% complete</p>
            <span className="text-sm font-semibold tabular-nums">{ws.percentComplete}%</span>
          </div>
          <input
            type="range"
            className="pct w-full"
            min={0}
            max={100}
            step={5}
            value={ws.percentComplete}
            onChange={(e) =>
              store.updateWorkstream(ws.id, { percentComplete: Number(e.target.value) }, { touch: true })
            }
          />
        </div>

        {/* Action items */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-700/60">
            Action items ({actions.length})
          </p>
          <div className="space-y-1.5">
            {actions.map((a) => (
              <div key={a.id} className="flex items-start gap-2 rounded-md border border-navy-100 px-2.5 py-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={a.status === 'done'}
                  onChange={(e) => store.updateActionItem(a.id, { status: e.target.checked ? 'done' : 'open' })}
                />
                <div className="min-w-0 flex-1">
                  <p className={a.status === 'done' ? 'text-navy-700/50 line-through' : ''}>{a.text}</p>
                  <p className="mt-0.5 text-[11px] text-navy-700/60">
                    {memberById.get(a.ownerId)?.name || 'Unassigned'}
                    {a.dueDate && (
                      <span className={isOverdue(a.dueDate) && a.status !== 'done' ? 'font-semibold text-red-600' : ''}>
                        {' '}· due {shortDate(a.dueDate)}
                      </span>
                    )}
                  </p>
                </div>
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                  style={{ background: `${ACTION_STATUSES[a.status].color}1a`, color: ACTION_STATUSES[a.status].color }}
                >
                  {ACTION_STATUSES[a.status].label}
                </span>
              </div>
            ))}
            {!actions.length && <p className="text-xs text-navy-700/50">No actions yet.</p>}
          </div>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!newAction.trim()) return;
              store.addActionItem({
                workstreamId: ws.id,
                ownerId: ws.ownerId,
                text: newAction.trim(),
                dueDate: addDays(todayISO(), 7),
              });
              setNewAction('');
            }}
          >
            <input
              className="field"
              placeholder="Add an action…"
              value={newAction}
              onChange={(e) => setNewAction(e.target.value)}
            />
            <button className="btn-ghost" type="submit">
              Add
            </button>
          </form>
        </div>

        {/* Notes timeline */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-700/60">Notes</p>
          <form
            className="mb-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              store.addNote(ws.id, noteText);
              setNoteText('');
            }}
          >
            <input
              className="field"
              placeholder="Add a note (refreshes last touched)…"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
            <button className="btn-accent" type="submit">
              Note
            </button>
          </form>
          <ol className="relative space-y-3 border-l border-navy-100 pl-4">
            {notes.map((n) => (
              <li key={n.id} className="relative">
                <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-accent" />
                <p className="text-sm text-navy-800">{n.text}</p>
                <p className="text-[11px] text-navy-700/60">
                  {n.author} · {shortDate(n.date)}
                </p>
              </li>
            ))}
            {!notes.length && <li className="text-xs text-navy-700/50">No notes yet.</li>}
          </ol>
        </div>
      </div>
    </aside>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-700/60">{label}</p>
      <div className="mt-0.5 text-navy-800">{children}</div>
    </div>
  );
}
