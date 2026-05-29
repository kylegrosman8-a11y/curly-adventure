import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore, useLookups, initials } from '../../store/store.jsx';
import { STATUS_ORDER, STATUSES } from '../../lib/status.js';
import { Avatar, EmptyState } from '../shared/ui.jsx';
import { shortDate, daysAgo } from '../../lib/dates.js';
import PasteNotesPanel from './PasteNotesPanel.jsx';
import EndCheckinModal from './EndCheckinModal.jsx';

export default function CheckinMode() {
  const store = useStore();
  const { accountById, memberById } = useLookups();
  const [memberId, setMemberId] = useState(store.team[0]?.id || null);
  const [endOpen, setEndOpen] = useState(false);

  // Session tracking captured the moment a member is selected.
  const snapshot = useRef({}); // wsId -> {status, percent}
  const [touchedIds, setTouchedIds] = useState(() => new Set());
  const [sessionActionIds, setSessionActionIds] = useState([]);
  const [noteDrafts, setNoteDrafts] = useState({});

  const member = store.team.find((m) => m.id === memberId) || null;
  const memberWs = useMemo(
    () => store.workstreams.filter((w) => w.ownerId === memberId),
    [store.workstreams, memberId]
  );

  // (Re)snapshot when the selected member changes.
  useEffect(() => {
    const snap = {};
    for (const w of store.workstreams.filter((x) => x.ownerId === memberId)) {
      snap[w.id] = { status: w.status, percent: w.percentComplete };
    }
    snapshot.current = snap;
    setTouchedIds(new Set());
    setSessionActionIds([]);
    setNoteDrafts({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId]);

  function markTouched(id) {
    setTouchedIds((prev) => {
      if (prev.has(id)) return prev;
      const n = new Set(prev);
      n.add(id);
      return n;
    });
  }

  function setStatus(ws, status) {
    store.updateWorkstream(ws.id, { status }, { touch: true });
    markTouched(ws.id);
  }
  function setPercent(ws, percentComplete) {
    store.updateWorkstream(ws.id, { percentComplete }, { touch: true });
    markTouched(ws.id);
  }
  function saveNote(ws) {
    const text = (noteDrafts[ws.id] || '').trim();
    if (!text) return;
    store.addNote(ws.id, text, member?.name);
    setNoteDrafts((d) => ({ ...d, [ws.id]: '' }));
    markTouched(ws.id);
  }

  function onAiApplied({ touchedIds: tIds = [], createdActionIds = [] }) {
    setTouchedIds((prev) => {
      const n = new Set(prev);
      tIds.forEach((id) => id && n.add(id));
      return n;
    });
    setSessionActionIds((prev) => [...prev, ...createdActionIds]);
  }

  // Build the before/after payload for the end-of-checkin summary.
  const touchedPayload = useMemo(() => {
    const idsWithActions = new Set(
      store.actionItems.filter((a) => sessionActionIds.includes(a.id) && a.workstreamId).map((a) => a.workstreamId)
    );
    const allIds = new Set([...touchedIds, ...idsWithActions]);
    const list = [];
    for (const id of allIds) {
      const ws = store.workstreams.find((w) => w.id === id);
      if (!ws) continue;
      const before = snapshot.current[id] || { status: ws.status, percent: ws.percentComplete };
      const latestNote = store.notes
        .filter((n) => n.workstreamId === id)
        .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
      const sessionActs = store.actionItems.filter(
        (a) => sessionActionIds.includes(a.id) && a.workstreamId === id
      );
      list.push({
        account: accountById.get(ws.accountId)?.name || '',
        title: ws.title,
        owner: member?.name || '',
        beforeStatus: before.status,
        afterStatus: ws.status,
        beforePercent: before.percent,
        afterPercent: ws.percentComplete,
        note: latestNote?.text || '',
        newActions: sessionActs.map((a) => ({ text: a.text, owner: member?.name, due: a.dueDate })),
      });
    }
    // Actions not tied to any workstream still belong to the member.
    const orphanActs = store.actionItems.filter(
      (a) => sessionActionIds.includes(a.id) && !a.workstreamId
    );
    if (orphanActs.length) {
      list.push({
        account: '',
        title: 'General follow-ups',
        owner: member?.name || '',
        beforeStatus: 'on_track',
        afterStatus: 'on_track',
        beforePercent: 0,
        afterPercent: 0,
        note: '',
        newActions: orphanActs.map((a) => ({ text: a.text, owner: member?.name, due: a.dueDate })),
      });
    }
    return list;
  }, [touchedIds, sessionActionIds, store.workstreams, store.actionItems, store.notes, accountById, member]);

  function handleSaveCheckin({ summaryMarkdown, followUpMarkdown }) {
    store.saveCheckin({
      memberId,
      summaryMarkdown,
      followUpMarkdown,
      itemsTouched: Array.from(touchedIds),
    });
    setEndOpen(false);
    // Reset the session for the same member.
    const snap = {};
    for (const w of memberWs) snap[w.id] = { status: w.status, percent: w.percentComplete };
    snapshot.current = snap;
    setTouchedIds(new Set());
    setSessionActionIds([]);
  }

  return (
    <div className="flex h-full">
      {/* Member rail */}
      <div className="flex w-60 flex-shrink-0 flex-col border-r border-navy-100 bg-white">
        <div className="border-b border-navy-100 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-700/60">Check-in with</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {store.team.map((m) => {
            const count = store.workstreams.filter((w) => w.ownerId === m.id).length;
            return (
              <button
                key={m.id}
                onClick={() => setMemberId(m.id)}
                className={`mb-1 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors ${
                  memberId === m.id ? 'bg-navy-800 text-white' : 'hover:bg-navy-50'
                }`}
              >
                <Avatar name={m.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-medium ${memberId === m.id ? '' : 'text-navy-800'}`}>{m.name}</p>
                  <p className={`truncate text-[11px] ${memberId === m.id ? 'text-white/60' : 'text-navy-700/60'}`}>
                    {m.role}
                  </p>
                </div>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    memberId === m.id ? 'bg-white/20' : 'bg-navy-50 text-navy-700/70'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Work area */}
      <div className="min-w-0 flex-1 overflow-y-auto bg-navy-50/30">
        {!member ? (
          <div className="p-8">
            <EmptyState title="Select a team member" hint="Pick someone from the left to run their check-in." />
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar name={member.name} size="lg" />
                <div>
                  <h2 className="text-lg font-semibold text-navy-800">{member.name}</h2>
                  <p className="text-sm text-navy-700/60">{member.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-navy-700/60">
                  {touchedIds.size} touched · {sessionActionIds.length} new actions
                </span>
                <button className="btn-primary" onClick={() => setEndOpen(true)} disabled={!touchedPayload.length}>
                  End check-in
                </button>
              </div>
            </div>

            {memberWs.length === 0 ? (
              <EmptyState title="No workstreams" hint={`${member.name} doesn't own any workstreams yet.`} />
            ) : (
              <p className="text-[11px] text-navy-700/50">
                Tip: Tab through rows. Status buttons and the % slider are keyboard-operable; press Enter in a note field to save it.
              </p>
            )}

            {memberWs.map((ws) => (
              <CheckinRow
                key={ws.id}
                ws={ws}
                account={accountById.get(ws.accountId)}
                touched={touchedIds.has(ws.id)}
                noteDraft={noteDrafts[ws.id] || ''}
                onStatus={(s) => setStatus(ws, s)}
                onPercent={(p) => setPercent(ws, p)}
                onNoteChange={(t) => setNoteDrafts((d) => ({ ...d, [ws.id]: t }))}
                onNoteSave={() => saveNote(ws)}
              />
            ))}

            {memberWs.length > 0 && <PasteNotesPanel memberWorkstreams={memberWs} onApplied={onAiApplied} />}
          </div>
        )}
      </div>

      {endOpen && member && (
        <EndCheckinModal
          open={endOpen}
          member={member}
          touched={touchedPayload}
          onClose={() => setEndOpen(false)}
          onSave={handleSaveCheckin}
        />
      )}
    </div>
  );
}

function CheckinRow({ ws, account, touched, noteDraft, onStatus, onPercent, onNoteChange, onNoteSave }) {
  const stale = daysAgo(ws.lastTouched) > 10;
  return (
    <div className={`card p-4 transition-shadow ${touched ? 'ring-1 ring-accent/40' : ''}`}>
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: account?.color }} />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-700/60">{account?.name}</p>
            <h3 className="text-sm font-semibold text-navy-800">{ws.title}</h3>
          </div>
        </div>
        <div className="text-right text-[11px] text-navy-700/60">
          <span className={stale ? 'font-semibold text-red-600' : ''}>last touched {shortDate(ws.lastTouched)}</span>
          {touched && <span className="ml-2 rounded-full bg-accent/15 px-1.5 py-0.5 font-semibold text-accent">updated</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Status buttons */}
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-navy-700/60">Status</p>
          <div className="flex gap-1.5">
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                onClick={() => onStatus(s)}
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
            <p className="text-[11px] font-semibold uppercase tracking-wide text-navy-700/60">% complete</p>
            <span className="text-xs font-semibold tabular-nums">{ws.percentComplete}%</span>
          </div>
          <input
            type="range"
            className="pct mt-1.5 w-full"
            min={0}
            max={100}
            step={5}
            value={ws.percentComplete}
            onChange={(e) => onPercent(Number(e.target.value))}
            aria-label={`${ws.title} percent complete`}
          />
        </div>
      </div>

      {/* Inline note */}
      <div className="mt-3 flex gap-2">
        <input
          className="field"
          placeholder="Inline note… (Enter to save)"
          value={noteDraft}
          onChange={(e) => onNoteChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onNoteSave();
            }
          }}
        />
        <button className="btn-ghost" onClick={onNoteSave} disabled={!noteDraft.trim()}>
          Save note
        </button>
      </div>
    </div>
  );
}
