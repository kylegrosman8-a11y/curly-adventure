import { useState } from 'react';
import {
  meddpiccRows,
  scoreMeddpicc,
  meddpiccBand,
  MEDDPICC_STATES,
  MEDDPICC_STATE_ORDER,
} from '../../lib/meddpicc.js';

function nextState(state) {
  const i = MEDDPICC_STATE_ORDER.indexOf(state);
  return MEDDPICC_STATE_ORDER[(i + 1) % MEDDPICC_STATE_ORDER.length];
}

// Compact qualification meter. `variant="badge"` (default) shows 8 segments +
// score; `variant="strip"` renders a full-width stretched bar for a Gantt bar.
export function MeddpiccMeter({ meddpicc, showScore = true, variant = 'badge' }) {
  const rows = meddpiccRows(meddpicc);
  const { pct } = scoreMeddpicc(meddpicc);
  const band = meddpiccBand(pct);

  if (variant === 'strip') {
    return (
      <span className="flex h-full w-full gap-px" title={`MEDDPICC ${pct}% — ${band.label}`}>
        {rows.map((r) => (
          <span key={r.key} className="h-full flex-1" style={{ background: MEDDPICC_STATES[r.state].color }} />
        ))}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5" title={`MEDDPICC ${pct}% — ${band.label}`}>
      <span className="flex gap-0.5">
        {rows.map((r) => (
          <span key={r.key} className="h-2 w-1.5 rounded-[1px]" style={{ background: MEDDPICC_STATES[r.state].color }} />
        ))}
      </span>
      {showScore && (
        <span className="text-[10px] font-bold tabular-nums" style={{ color: band.color }}>
          {pct}%
        </span>
      )}
    </span>
  );
}

// MEDDPICC scorecard. Read-only by default; pass `onCycle`/`onNote` to edit.
// Clicking a letter cycles Red → Amber → Green; notes are editable inline.
export function MeddpiccScorecard({ meddpicc, onCycle, onNote }) {
  const rows = meddpiccRows(meddpicc);
  const s = scoreMeddpicc(meddpicc);
  const band = meddpiccBand(s.pct);
  const editable = Boolean(onCycle || onNote);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-navy-700/60">MEDDPICC</p>
        <span className="text-xs font-semibold" style={{ color: band.color }}>
          {s.green}/{s.total} green · {s.pct}% · {band.label}
        </span>
      </div>
      <div className="overflow-hidden rounded-md border border-navy-100">
        {rows.map((r, i) => (
          <div key={r.key} className={`flex items-start gap-2.5 px-2.5 py-1.5 text-xs ${i % 2 ? 'bg-navy-50/40' : ''}`}>
            <button
              type="button"
              disabled={!onCycle}
              onClick={() => onCycle?.(r.key, nextState(r.state))}
              className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded font-bold text-white ${
                onCycle ? 'cursor-pointer hover:ring-2 hover:ring-offset-1' : ''
              }`}
              style={{ background: MEDDPICC_STATES[r.state].color }}
              title={onCycle ? `${r.hint}\nClick to cycle R→A→G` : r.hint}
            >
              {r.letter}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-navy-800">{r.label}</span>
                <span className="text-[10px] font-semibold uppercase" style={{ color: MEDDPICC_STATES[r.state].color }}>
                  {MEDDPICC_STATES[r.state].label}
                </span>
              </div>
              {onNote ? (
                <NoteField value={r.note} placeholder={r.prompt} onSave={(text) => onNote(r.key, text)} />
              ) : (
                <p className="text-navy-700/70">{r.note || <span className="italic text-navy-700/40">{r.prompt}</span>}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      {editable && <p className="mt-1.5 text-[11px] text-navy-700/50">Click a letter to cycle Red → Amber → Green; type to update the note.</p>}
    </div>
  );
}

function NoteField({ value, placeholder, onSave }) {
  const [text, setText] = useState(value || '');
  return (
    <input
      className="mt-0.5 w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-xs text-navy-700/80 outline-none placeholder:italic placeholder:text-navy-700/40 hover:border-navy-100 focus:border-accent focus:bg-white"
      value={text}
      placeholder={placeholder}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => text !== (value || '') && onSave(text)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
    />
  );
}
