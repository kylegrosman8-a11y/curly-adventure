import { meddpiccRows, scoreMeddpicc, meddpiccBand, MEDDPICC_STATES } from '../../lib/meddpicc.js';

// Compact qualification meter: an 8-segment bar coloured by element state plus a
// score badge. Used on the Gantt bar and as a header for the scorecard.
export function MeddpiccMeter({ meddpicc, showScore = true }) {
  const rows = meddpiccRows(meddpicc);
  const { pct } = scoreMeddpicc(meddpicc);
  const band = meddpiccBand(pct);
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

// Read-only scorecard: every element with its state and note, plus the headline
// score. (Inline editing, check-in gap prompts, and the AI coach come next phase.)
export function MeddpiccScorecard({ meddpicc }) {
  const rows = meddpiccRows(meddpicc);
  const s = scoreMeddpicc(meddpicc);
  const band = meddpiccBand(s.pct);
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
            <span
              className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded font-bold text-white"
              style={{ background: MEDDPICC_STATES[r.state].color }}
              title={r.hint}
            >
              {r.letter}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-navy-800">{r.label}</span>
                <span className="text-[10px] font-semibold uppercase" style={{ color: MEDDPICC_STATES[r.state].color }}>
                  {MEDDPICC_STATES[r.state].label}
                </span>
              </div>
              <p className="text-navy-700/70">{r.note || <span className="italic text-navy-700/40">{r.prompt}</span>}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
