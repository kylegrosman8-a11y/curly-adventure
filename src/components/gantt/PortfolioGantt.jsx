import { useMemo, useState } from 'react';
import { useStore, useLookups } from '../../store/store.jsx';
import { STATUS_ORDER, STATUSES } from '../../lib/status.js';
import { FUNCTION_ORDER, functionMeta } from '../../lib/functions.js';
import { buildDomain, monthTicks, weekTicks, todayX, dateToX, ROW_HEIGHT } from './timeline.js';
import GanttBar from './GanttBar.jsx';
import WorkstreamPanel from './WorkstreamPanel.jsx';
import { EmptyState } from '../shared/ui.jsx';
import { buildPortfolioMarkdown, downloadMarkdown, slug } from '../../lib/markdown.js';
import { openRoadmap, buildRoadmapMarkdown } from '../../lib/roadmap.js';
import { todayISO, shortDate } from '../../lib/dates.js';

const LABEL_W = 220;

export default function PortfolioGantt() {
  const store = useStore();
  const { memberById } = useLookups();
  const [selectedId, setSelectedId] = useState(null);
  const [filters, setFilters] = useState({ account: null, member: null, status: null });
  const [grouping, setGrouping] = useState('function'); // 'function' | 'phase'

  const filtered = useMemo(() => {
    return store.workstreams.filter((w) => {
      if (filters.account && w.accountId !== filters.account) return false;
      if (filters.member && w.ownerId !== filters.member) return false;
      if (filters.status && w.status !== filters.status) return false;
      return true;
    });
  }, [store.workstreams, filters]);

  const domain = useMemo(
    () => buildDomain(filtered.length ? filtered : store.workstreams),
    [filtered, store.workstreams]
  );

  // Every account is shown (empty accounts are signal), unless a single account
  // is filtered to.
  const visibleAccounts = useMemo(
    () => store.accounts.filter((a) => !filters.account || a.id === filters.account),
    [store.accounts, filters.account]
  );

  function toggle(key, value) {
    setFilters((f) => ({ ...f, [key]: f[key] === value ? null : value }));
  }

  const months = monthTicks(domain);
  const weeks = weekTicks(domain);
  const tX = todayX(domain);

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Filter + control bar */}
        <div className="space-y-2 border-b border-navy-100 bg-white px-5 py-2.5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <FilterGroup label="Account">
              {store.accounts.map((a) => (
                <Chip key={a.id} active={filters.account === a.id} onClick={() => toggle('account', a.id)}>
                  <span className="h-2 w-2 rounded-full" style={{ background: a.color }} />
                  {a.name}
                </Chip>
              ))}
            </FilterGroup>
            <FilterGroup label="Member">
              {store.team.map((m) => (
                <Chip key={m.id} active={filters.member === m.id} onClick={() => toggle('member', m.id)}>
                  {m.name}
                </Chip>
              ))}
            </FilterGroup>
            <FilterGroup label="Status">
              {STATUS_ORDER.map((s) => (
                <Chip key={s} active={filters.status === s} onClick={() => toggle('status', s)}>
                  <span className="h-2 w-2 rounded-full" style={{ background: STATUSES[s].color }} />
                  {STATUSES[s].short}
                </Chip>
              ))}
            </FilterGroup>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-navy-700/50">Group by</span>
              <div className="flex gap-1 rounded-lg bg-navy-50 p-0.5">
                {['function', 'phase'].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGrouping(g)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize ${
                      grouping === g ? 'bg-white text-navy-800 shadow-sm' : 'text-navy-700/60'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Status legend */}
            <div className="flex flex-wrap items-center gap-2.5">
              {STATUS_ORDER.map((s) => (
                <span key={s} className="inline-flex items-center gap-1 text-[10px] font-medium text-navy-700/70">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: STATUSES[s].color }} />
                  {STATUSES[s].label}
                </span>
              ))}
            </div>

            <button
              className="btn-ghost ml-auto !py-1.5 text-xs"
              onClick={() =>
                downloadMarkdown(
                  `portfolio-${slug(todayISO())}`,
                  buildPortfolioMarkdown({ accounts: store.accounts, workstreams: store.workstreams, memberById })
                )
              }
            >
              ↓ Export portfolio
            </button>
          </div>
        </div>

        {/* Gantt scroll area */}
        <div className="min-h-0 flex-1 overflow-auto" onClick={() => setSelectedId(null)}>
          <div className="relative" style={{ width: LABEL_W + domain.width, minWidth: '100%' }}>
            {/* Timeline header */}
            <div className="sticky top-0 z-20 flex h-9 border-b border-navy-100 bg-white">
              <div className="flex-shrink-0 border-r border-navy-100" style={{ width: LABEL_W }} />
              <div className="relative" style={{ width: domain.width }}>
                {months.map((m) => (
                  <div
                    key={m.iso}
                    className="absolute top-0 flex h-full items-center border-l border-navy-100 pl-1.5 text-[11px] font-semibold uppercase tracking-wide text-navy-700/70"
                    style={{ left: m.x }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>
            </div>

            {visibleAccounts.map((acc) => {
              const accStreams = filtered.filter((w) => w.accountId === acc.id);
              const subLanes = buildSubLanes(accStreams, grouping);
              const milestones = store.milestones
                .filter((m) => m.accountId === acc.id)
                .sort((a, b) => (a.date < b.date ? -1 : 1));

              return (
                <div key={acc.id} className="border-b-2 border-navy-100">
                  {/* Account header band */}
                  <div className="flex items-center bg-navy-50/70" style={{ minHeight: 34 }}>
                    <div
                      className="flex flex-shrink-0 items-center gap-2 border-r border-navy-100 px-3 py-1.5"
                      style={{ width: LABEL_W }}
                    >
                      <span className="h-4 w-1 rounded-full" style={{ background: acc.color }} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-navy-800">{acc.name}</p>
                        <p className="truncate text-[11px] text-navy-700/60">{acc.owner}</p>
                      </div>
                    </div>
                    <div className="flex flex-1 items-center justify-end gap-1.5 px-3">
                      <RoadmapExport account={acc} streams={accStreams} milestones={milestones} memberById={memberById} />
                    </div>
                  </div>

                  {/* Milestone strip */}
                  {milestones.length > 0 && (
                    <div className="flex border-b border-dashed border-navy-100 bg-amber-50/40">
                      <div
                        className="flex-shrink-0 border-r border-navy-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-navy-700/50"
                        style={{ width: LABEL_W }}
                      >
                        Milestones
                      </div>
                      <div className="relative" style={{ width: domain.width, height: 24 }}>
                        {milestones.map((m) => (
                          <div
                            key={m.id}
                            className="absolute top-1 -translate-x-1/2 whitespace-nowrap text-xs text-accent"
                            style={{ left: dateToX(m.date, domain) }}
                            title={`${m.label} — ${shortDate(m.date)}${m.note ? `\n${m.note}` : ''}`}
                          >
                            ★<span className="ml-0.5 text-[9px] font-medium text-navy-800">{m.label}</span>
                          </div>
                        ))}
                        {tX >= 0 && tX <= domain.width && (
                          <div className="absolute inset-y-0 z-10 w-px bg-accent/70" style={{ left: tX }} />
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sub-lanes */}
                  {subLanes.length === 0 ? (
                    <div className="flex">
                      <div className="flex-shrink-0 border-r border-navy-100" style={{ width: LABEL_W }} />
                      <div className="px-3 py-2 text-xs italic text-navy-700/40">
                        {filters.member || filters.status ? 'No streams match the filters.' : 'No active streams.'}
                      </div>
                    </div>
                  ) : (
                    subLanes.map((lane) => (
                      <div key={lane.key} className="flex border-t border-navy-100/60">
                        <div
                          className="flex flex-shrink-0 items-center gap-1.5 border-r border-navy-100 px-3 py-1"
                          style={{ width: LABEL_W }}
                        >
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: lane.color }} />
                          <span className="truncate text-xs font-medium text-navy-700/80">{lane.label}</span>
                          <span className="ml-auto text-[10px] text-navy-700/40">{lane.items.length}</span>
                        </div>
                        <div className="relative" style={{ width: domain.width, height: lane.items.length * ROW_HEIGHT }}>
                          {weeks.map((w) => (
                            <div key={w.iso} className="absolute inset-y-0 w-px bg-navy-50" style={{ left: w.x }} />
                          ))}
                          {tX >= 0 && tX <= domain.width && (
                            <div className="absolute inset-y-0 z-10 w-px bg-accent/70" style={{ left: tX }} />
                          )}
                          {lane.items.map((ws, i) => (
                            <div key={ws.id} className="absolute left-0 right-0" style={{ top: i * ROW_HEIGHT, height: ROW_HEIGHT }}>
                              <GanttBar
                                ws={ws}
                                domain={domain}
                                ownerName={memberById.get(ws.ownerId)?.name}
                                selected={selectedId === ws.id}
                                onSelect={setSelectedId}
                                onCommit={(id, patch) => store.updateWorkstream(id, patch)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedId && <WorkstreamPanel workstreamId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

// Group an account's streams into sub-lanes by the chosen axis.
function buildSubLanes(items, grouping) {
  if (grouping === 'function') {
    return FUNCTION_ORDER.map((f) => ({
      key: f,
      label: functionMeta(f).label,
      color: functionMeta(f).color,
      items: items.filter((w) => w.function === f),
    })).filter((g) => g.items.length > 0);
  }
  const phases = [...new Set(items.map((w) => w.phase || 'Unphased'))].sort();
  return phases.map((p) => ({
    key: p,
    label: p,
    color: '#64748b',
    items: items.filter((w) => (w.phase || 'Unphased') === p),
  }));
}

function RoadmapExport({ account, streams, milestones, memberById }) {
  const [open, setOpen] = useState(false);
  const args = { account, workstreams: streams, milestones, memberById };
  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button className="btn-ghost !px-2.5 !py-1 text-[11px]" onClick={() => setOpen((o) => !o)}>
        ↗ Roadmap
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-44 rounded-md border border-navy-100 bg-white py-1 shadow-lg">
          <button
            className="block w-full px-3 py-1.5 text-left text-xs hover:bg-navy-50"
            onClick={() => {
              openRoadmap(args);
              setOpen(false);
            }}
          >
            🖨 Open printable (PDF)
          </button>
          <button
            className="block w-full px-3 py-1.5 text-left text-xs hover:bg-navy-50"
            onClick={() => {
              downloadMarkdown(`roadmap-${slug(account.name)}`, buildRoadmapMarkdown(args));
              setOpen(false);
            }}
          >
            ↓ Download .md
          </button>
        </div>
      )}
    </div>
  );
}

function FilterGroup({ label, children }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-navy-700/50">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={`chip ${active ? 'chip-active' : 'chip-on'}`}>
      {children}
    </button>
  );
}
