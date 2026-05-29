import { useState } from 'react';
import { useStore, useLookups } from '../../store/store.jsx';
import { StatusBadge, Avatar, FunctionTag } from '../shared/ui.jsx';
import { MeddpiccScorecard } from '../shared/Meddpicc.jsx';
import { isSales, coeTypeMeta } from '../../lib/functions.js';
import { MEDDPICC_ELEMENTS, meddpiccGaps, MEDDPICC_STATES } from '../../lib/meddpicc.js';
import { meddpiccCoach, hasApiKey, AIError } from '../../lib/claude.js';
import WorkstreamForm from '../edit/WorkstreamForm.jsx';
import MilestoneForm from '../edit/MilestoneForm.jsx';
import { STATUS_ORDER, STATUSES, ACTION_STATUSES, formatValue } from '../../lib/status.js';
import { shortDate, daysAgo, isOverdue, addDays, todayISO } from '../../lib/dates.js';

// Slide-over detail panel: full workstream detail, notes timeline, action items.
export default function WorkstreamPanel({ workstreamId, onClose }) {
  const store = useStore();
  const { accountById, memberById } = useLookups();
  const ws = store.workstreams.find((w) => w.id === workstreamId);
  const [noteText, setNoteText] = useState('');
  const [newAction, setNewAction] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [msForm, setMsForm] = useState(null);

  if (!ws) return null;
  const account = accountById.get(ws.accountId);
  const owner = memberById.get(ws.ownerId);
  const notes = store.notes
    .filter((n) => n.workstreamId === ws.id)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const actions = store.actionItems.filter((a) => a.workstreamId === ws.id);
  const milestones = store.milestones
    .filter((m) => m.workstreamId === ws.id)
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  return (
    <aside className="flex h-full w-[420px] flex-shrink-0 flex-col border-l border-navy-100 bg-white">
      <div className="flex items-start justify-between border-b border-navy-100 px-5 py-3" style={{ borderTopColor: account?.color }}>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-700/60">{account?.name}</p>
            <FunctionTag fn={ws.function} size="sm" />
            {ws.function === 'coe' && ws.coeType && (
              <span className="text-[11px] font-semibold text-navy-700/70">{coeTypeMeta(ws.coeType).label}</span>
            )}
            {ws.phase && (
              <span className="rounded bg-navy-50 px-1.5 py-0.5 text-[10px] font-semibold text-navy-700/70">{ws.phase}</span>
            )}
          </div>
          <h2 className="truncate text-base font-semibold text-navy-800">{ws.title}</h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditOpen(true)}
            className="rounded-full px-2 py-1 text-[11px] font-medium text-navy-700/60 hover:bg-navy-50 hover:text-navy-800"
            title="Edit workstream"
          >
            ✎ Edit
          </button>
          <button onClick={onClose} className="rounded p-1 text-navy-700/60 hover:bg-navy-50" aria-label="Close panel">
            ✕
          </button>
        </div>
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
          <div className="flex flex-wrap gap-1.5">
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                onClick={() => store.updateWorkstream(ws.id, { status: s }, { touch: true })}
                className="rounded-md border px-2 py-1 text-xs font-medium transition-colors"
                style={
                  ws.status === s
                    ? { background: STATUSES[s].color, borderColor: STATUSES[s].color, color: '#fff' }
                    : { borderColor: '#dce3ef', color: STATUSES[s].color }
                }
              >
                {STATUSES[s].short}
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

        {/* MEDDPICC scorecard — sales streams only */}
        {isSales(ws) && (
          <div>
            <MeddpiccScorecard
              meddpicc={ws.meddpicc}
              onCycle={(key, state) => store.updateMeddpicc(ws.id, key, { state })}
              onNote={(key, note) => store.updateMeddpicc(ws.id, key, { note })}
            />
            <MeddpiccCoachPanel ws={ws} notes={notes} onApplyFill={(key, state) => store.updateMeddpicc(ws.id, key, { state })} onAddAction={(text) => store.addActionItem({ workstreamId: ws.id, ownerId: ws.ownerId, text, dueDate: addDays(todayISO(), 7) })} />
          </div>
        )}

        {/* Milestones */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-700/60">Milestones</p>
            <button
              className="text-[11px] font-semibold text-accent hover:underline"
              onClick={() => setMsForm({ defaults: { accountId: ws.accountId, workstreamId: ws.id, phase: ws.phase } })}
            >
              ＋ Add
            </button>
          </div>
          <div className="space-y-1.5">
            {milestones.map((m) => (
              <button
                key={m.id}
                onClick={() => setMsForm({ milestone: m })}
                className="flex w-full items-start gap-2 rounded-md border border-navy-100 px-2.5 py-1.5 text-left text-sm hover:border-accent/40 hover:bg-navy-50/40"
              >
                <span className="mt-0.5 text-accent">★</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-navy-800">
                    {m.label} <span className="font-normal text-navy-700/60">· {shortDate(m.date)}</span>
                  </p>
                  {m.note && <p className="text-[11px] text-navy-700/60">{m.note}</p>}
                </div>
              </button>
            ))}
            {!milestones.length && <p className="text-xs text-navy-700/50">No milestones yet.</p>}
          </div>
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

      {editOpen && <WorkstreamForm open workstream={ws} onClose={() => setEditOpen(false)} />}
      {msForm && (
        <MilestoneForm open milestone={msForm.milestone} defaults={msForm.defaults || {}} onClose={() => setMsForm(null)} />
      )}
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

const elementLabel = (key) => MEDDPICC_ELEMENTS.find((e) => e.key === key)?.label || key;

// AI coach: auto-fill suggestions from notes + the top gaps to close this week
// with drafted discovery questions. Falls back to local prompts when offline.
function MeddpiccCoachPanel({ ws, notes, onApplyFill, onAddAction }) {
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  async function run() {
    setBusy(true);
    setNote('');
    const gaps = meddpiccGaps(ws.meddpicc).slice(0, 3);
    const localFocus = gaps.map((g) => ({ key: g.key, question: g.prompt }));

    if (!hasApiKey()) {
      setResult({ fills: [], focus: localFocus });
      setNote('AI offline — showing the standard discovery questions for your open gaps.');
      setBusy(false);
      return;
    }
    try {
      const opp = {
        title: ws.title,
        account: ws.accountId,
        status: ws.status,
        value: ws.value,
        meddpicc: ws.meddpicc,
        notes: notes.map((n) => n.text),
      };
      const res = await meddpiccCoach(opp);
      setResult({
        fills: res.fills || [],
        focus: res.focus?.length ? res.focus : localFocus,
      });
    } catch (e) {
      setResult({ fills: [], focus: localFocus });
      setNote(e instanceof AIError ? `AI unavailable — using standard questions. (${e.message})` : 'Using standard questions.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2 rounded-md border border-navy-100 bg-navy-50/40 p-2.5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-700/60">MEDDPICC coach</p>
        <button className="btn-accent !px-2.5 !py-1 text-xs" onClick={run} disabled={busy}>
          {busy ? 'Thinking…' : result ? 'Re-run' : 'Coach me'}
        </button>
      </div>
      {note && <p className="mt-1.5 text-[11px] text-navy-700/60">{note}</p>}

      {result && (
        <div className="mt-2 space-y-3">
          {result.fills.length > 0 && (
            <div>
              <p className="mb-1 text-[11px] font-semibold text-navy-700/70">Suggested from your notes</p>
              <div className="space-y-1.5">
                {result.fills.map((f, i) => (
                  <div key={i} className="flex items-start gap-2 rounded border border-navy-100 bg-white px-2 py-1.5 text-xs">
                    <span
                      className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded text-[9px] font-bold text-white"
                      style={{ background: MEDDPICC_STATES[f.state]?.color || '#94a3b8' }}
                    >
                      {elementLabel(f.key)[0]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-navy-800">
                        {elementLabel(f.key)} → {MEDDPICC_STATES[f.state]?.label || f.state}
                      </p>
                      {f.why && <p className="text-navy-700/60">{f.why}</p>}
                    </div>
                    <button className="btn-ghost !px-2 !py-0.5 text-[11px]" onClick={() => onApplyFill(f.key, f.state)}>
                      Apply
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.focus.length > 0 && (
            <div>
              <p className="mb-1 text-[11px] font-semibold text-navy-700/70">Close these gaps this week</p>
              <div className="space-y-1.5">
                {result.focus.map((q, i) => (
                  <div key={i} className="rounded border border-navy-100 bg-white px-2 py-1.5 text-xs">
                    <p className="font-medium text-navy-800">{elementLabel(q.key)}</p>
                    <p className="text-navy-700/70">{q.question}</p>
                    <button
                      className="mt-1 text-[11px] font-semibold text-accent hover:underline"
                      onClick={() => onAddAction(`[${elementLabel(q.key)}] ${q.question}`)}
                    >
                      ＋ Add as follow-up action
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
