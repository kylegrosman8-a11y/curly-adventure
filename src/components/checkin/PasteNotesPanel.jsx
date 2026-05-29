import { useState } from 'react';
import { useLookups, useStore } from '../../store/store.jsx';
import { extractUpdates, hasApiKey, AIError } from '../../lib/claude.js';
import { STATUSES } from '../../lib/status.js';
import { shortDate } from '../../lib/dates.js';

// "Paste notes" box: raw notes/transcript -> AI extracts structured updates ->
// diff preview -> user confirms -> applies to workstreams + creates actions.
export default function PasteNotesPanel({ memberWorkstreams, onApplied }) {
  const store = useStore();
  const { memberById } = useLookups();
  const [raw, setRaw] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null); // {updates, newActions} with `include` flags

  async function runExtract() {
    setError(null);
    setBusy(true);
    try {
      const wsForModel = memberWorkstreams.map((w) => ({
        id: w.id,
        title: w.title,
        ownerName: memberById.get(w.ownerId)?.name,
      }));
      const result = await extractUpdates(raw, wsForModel);
      setPreview({
        updates: result.updates.map((u) => ({ ...u, include: true })),
        newActions: result.newActions.map((a) => ({ ...a, include: true })),
      });
    } catch (e) {
      setError(e instanceof AIError ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function applyPreview() {
    if (!preview) return;
    for (const u of preview.updates) {
      if (!u.include) continue;
      const patch = {};
      if (u.newStatus && STATUSES[u.newStatus]) patch.status = u.newStatus;
      if (typeof u.newPercent === 'number') patch.percentComplete = Math.max(0, Math.min(100, u.newPercent));
      if (Object.keys(patch).length) store.updateWorkstream(u.workstreamId, patch, { touch: true });
      if (u.noteText) store.addNote(u.workstreamId, u.noteText);
    }
    const createdActionIds = [];
    for (const a of preview.newActions) {
      if (!a.include) continue;
      // Try to resolve ownerGuess to a team member.
      const owner = store.team.find(
        (m) => m.name.toLowerCase() === (a.ownerGuess || '').toLowerCase()
      );
      const created = store.addActionItem({
        workstreamId: a.workstreamIdOrNull || null,
        ownerId: owner?.id || null,
        text: a.text,
        dueDate: a.dueGuess || null,
      });
      createdActionIds.push(created.id);
    }
    const touchedIds = preview.updates.filter((u) => u.include).map((u) => u.workstreamId);
    setPreview(null);
    setRaw('');
    onApplied?.({ touchedIds, createdActionIds });
  }

  const wsTitle = (id) => store.workstreams.find((w) => w.id === id)?.title || '(unmatched)';

  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-navy-800">Paste notes → extract updates</h3>
        {!hasApiKey() && <span className="text-[11px] text-navy-700/50">AI offline — enter updates manually above</span>}
      </div>
      <textarea
        className="field h-28 resize-y font-mono text-xs"
        placeholder="Paste raw check-in notes or a transcript here. Claude will map them to this member's workstreams, infer status, and pull out commitments as actions."
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        disabled={busy}
      />
      <div className="mt-2 flex items-center gap-2">
        <button className="btn-accent" onClick={runExtract} disabled={busy || !raw.trim() || !hasApiKey()}>
          {busy ? 'Extracting…' : 'Extract with AI'}
        </button>
        {raw && (
          <button className="btn-ghost" onClick={() => setRaw('')} disabled={busy}>
            Clear
          </button>
        )}
      </div>

      {error && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <strong>AI unavailable:</strong> {error}
          <div className="mt-1 text-red-600/80">No problem — enter the updates manually above; nothing is blocked.</div>
        </div>
      )}

      {preview && (
        <div className="mt-3 rounded-md border border-navy-100 bg-navy-50/40 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-700/60">Review extracted changes</p>

          {preview.updates.length > 0 && (
            <div className="mb-3 space-y-1.5">
              <p className="text-[11px] font-semibold text-navy-700/70">Workstream updates</p>
              {preview.updates.map((u, i) => (
                <label key={i} className="flex items-start gap-2 rounded border border-navy-100 bg-white px-2.5 py-1.5 text-xs">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={u.include}
                    onChange={(e) =>
                      setPreview((p) => ({
                        ...p,
                        updates: p.updates.map((x, j) => (j === i ? { ...x, include: e.target.checked } : x)),
                      }))
                    }
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-navy-800">{wsTitle(u.workstreamId)}</p>
                    <p className="text-navy-700/70">
                      {u.newStatus && <span>→ {STATUSES[u.newStatus]?.label || u.newStatus} </span>}
                      {typeof u.newPercent === 'number' && <span>· {u.newPercent}% </span>}
                      {u.noteText && <span className="italic">· “{u.noteText}”</span>}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {preview.newActions.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold text-navy-700/70">New actions</p>
              {preview.newActions.map((a, i) => (
                <label key={i} className="flex items-start gap-2 rounded border border-navy-100 bg-white px-2.5 py-1.5 text-xs">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={a.include}
                    onChange={(e) =>
                      setPreview((p) => ({
                        ...p,
                        newActions: p.newActions.map((x, j) => (j === i ? { ...x, include: e.target.checked } : x)),
                      }))
                    }
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-navy-800">{a.text}</p>
                    <p className="text-navy-700/70">
                      {a.workstreamIdOrNull ? wsTitle(a.workstreamIdOrNull) : 'No workstream'}
                      {a.ownerGuess && ` · ${a.ownerGuess}`}
                      {a.dueGuess && ` · due ${shortDate(a.dueGuess)}`}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}

          {!preview.updates.length && !preview.newActions.length && (
            <p className="text-xs text-navy-700/60">No structured changes found in those notes.</p>
          )}

          <div className="mt-3 flex gap-2">
            <button className="btn-primary" onClick={applyPreview}>
              Apply selected
            </button>
            <button className="btn-ghost" onClick={() => setPreview(null)}>
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
