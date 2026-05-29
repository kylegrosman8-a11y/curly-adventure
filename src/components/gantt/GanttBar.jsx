import { useRef, useState } from 'react';
import { barGeometry, DAY_WIDTH, xToDate } from './timeline.js';
import { statusColor, STALE_DAYS } from '../../lib/status.js';
import { initials } from '../../store/store.jsx';
import { daysAgo, daysBetween, addDays } from '../../lib/dates.js';
import { MeddpiccMeter } from '../shared/Meddpicc.jsx';

// A draggable / resizable workstream bar.
// - Drag the body to shift both dates.
// - Drag either edge handle to resize duration.
export default function GanttBar({ ws, domain, ownerName, selected, onSelect, onCommit }) {
  const { x, width } = barGeometry(ws, domain);
  const [drag, setDrag] = useState(null); // {mode, startX, origStart, origEnd}
  const previewRef = useRef(null);

  const stale = daysAgo(ws.lastTouched) > STALE_DAYS;
  const color = statusColor(ws.status);

  // Live preview offsets while dragging (don't write to store until mouseup).
  const [preview, setPreview] = useState(null);

  function beginDrag(mode, e) {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const orig = { start: ws.startDate, end: ws.endDate };
    const state = { mode, startX, orig };
    setDrag(state);

    function onMove(ev) {
      const deltaDays = Math.round((ev.clientX - startX) / DAY_WIDTH);
      if (deltaDays === 0) {
        setPreview(null);
        return;
      }
      if (mode === 'move') {
        setPreview({ start: addDays(orig.start, deltaDays), end: addDays(orig.end, deltaDays) });
      } else if (mode === 'resize-end') {
        const newEnd = addDays(orig.end, deltaDays);
        if (daysBetween(newEnd, orig.start) >= 1) setPreview({ start: orig.start, end: newEnd });
      } else if (mode === 'resize-start') {
        const newStart = addDays(orig.start, deltaDays);
        if (daysBetween(orig.end, newStart) >= 1) setPreview({ start: newStart, end: orig.end });
      }
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      setDrag(null);
      setPreview((p) => {
        if (p && (p.start !== orig.start || p.end !== orig.end)) {
          onCommit(ws.id, { startDate: p.start, endDate: p.end });
        }
        return null;
      });
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  const eff = preview || ws;
  const geo = barGeometry(eff, domain);
  const filledW = Math.max(0, Math.min(geo.width, (geo.width * (ws.percentComplete || 0)) / 100));

  return (
    <div
      ref={previewRef}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(ws.id);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(ws.id);
        }
      }}
      onMouseDown={(e) => beginDrag('move', e)}
      className={`group absolute top-1.5 flex h-8 cursor-grab items-center overflow-hidden rounded-md text-xs text-white shadow-sm transition-shadow active:cursor-grabbing ${
        selected ? 'ring-2 ring-accent ring-offset-1' : ''
      } ${drag ? 'opacity-90 shadow-lg' : ''}`}
      style={{ left: geo.x, width: geo.width, background: color }}
      title={`${ws.title} — ${ws.percentComplete}%`}
    >
      {/* filled portion */}
      <div className="absolute inset-y-0 left-0 bg-black/20" style={{ width: filledW }} />

      {/* resize handles */}
      <span
        onMouseDown={(e) => beginDrag('resize-start', e)}
        className="absolute inset-y-0 left-0 z-10 w-1.5 cursor-ew-resize opacity-0 group-hover:opacity-100"
        style={{ background: 'rgba(255,255,255,.5)' }}
      />
      <span
        onMouseDown={(e) => beginDrag('resize-end', e)}
        className="absolute inset-y-0 right-0 z-10 w-1.5 cursor-ew-resize opacity-0 group-hover:opacity-100"
        style={{ background: 'rgba(255,255,255,.5)' }}
      />

      <div className="relative z-0 flex w-full items-center gap-1.5 px-2">
        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-white/25 text-[9px] font-bold">
          {initials(ownerName)}
        </span>
        <span className="truncate font-medium">{ws.title}</span>
        <span className="ml-auto flex-shrink-0 font-semibold tabular-nums">{ws.percentComplete}%</span>
      </div>

      {/* Qualification meter for sales opportunities */}
      {ws.function === 'sales' && ws.meddpicc && (
        <span className="absolute inset-x-0 bottom-0 z-10 h-[3px]">
          <MeddpiccMeter meddpicc={ws.meddpicc} variant="strip" />
        </span>
      )}

      {stale && (
        <span
          className="absolute -right-0.5 -top-0.5 z-20 h-2.5 w-2.5 rounded-full border border-white bg-red-500"
          title={`Stale — last touched ${daysAgo(ws.lastTouched)} days ago`}
        />
      )}
    </div>
  );
}
