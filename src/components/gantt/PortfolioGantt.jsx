import { useMemo, useState } from 'react';
import { useStore, useLookups } from '../../store/store.jsx';
import { STATUS_ORDER, STATUSES } from '../../lib/status.js';
import { buildDomain, monthTicks, weekTicks, todayX, ROW_HEIGHT } from './timeline.js';
import GanttBar from './GanttBar.jsx';
import WorkstreamPanel from './WorkstreamPanel.jsx';
import { EmptyState } from '../shared/ui.jsx';
import { buildPortfolioMarkdown, downloadMarkdown, slug } from '../../lib/markdown.js';
import { todayISO } from '../../lib/dates.js';

const LABEL_W = 220;

export default function PortfolioGantt() {
  const store = useStore();
  const { memberById } = useLookups();
  const [selectedId, setSelectedId] = useState(null);
  const [filters, setFilters] = useState({ account: null, member: null, status: null });

  const filtered = useMemo(() => {
    return store.workstreams.filter((w) => {
      if (filters.account && w.accountId !== filters.account) return false;
      if (filters.member && w.ownerId !== filters.member) return false;
      if (filters.status && w.status !== filters.status) return false;
      return true;
    });
  }, [store.workstreams, filters]);

  const domain = useMemo(() => buildDomain(filtered.length ? filtered : store.workstreams), [filtered, store.workstreams]);

  // Group filtered workstreams by account (preserving account order).
  const groups = useMemo(() => {
    return store.accounts
      .map((acc) => ({ account: acc, items: filtered.filter((w) => w.accountId === acc.id) }))
      .filter((g) => g.items.length > 0);
  }, [store.accounts, filtered]);

  function toggle(key, value) {
    setFilters((f) => ({ ...f, [key]: f[key] === value ? null : value }));
  }

  const months = monthTicks(domain);
  const weeks = weekTicks(domain);
  const tX = todayX(domain);

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-navy-100 bg-white px-5 py-2.5">
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
                {STATUSES[s].label}
              </Chip>
            ))}
          </FilterGroup>
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

        {/* Gantt scroll area */}
        <div className="min-h-0 flex-1 overflow-auto" onClick={() => setSelectedId(null)}>
          {groups.length === 0 ? (
            <div className="p-8">
              <EmptyState title="No workstreams match these filters" hint="Clear a filter chip above to see more." />
            </div>
          ) : (
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

              {/* Swimlanes */}
              {groups.map((g) => (
                <div key={g.account.id} className="border-b border-navy-100">
                  <div className="flex">
                    {/* Account label column */}
                    <div
                      className="flex flex-shrink-0 items-center gap-2 border-r border-navy-100 bg-navy-50/40 px-3 py-2"
                      style={{ width: LABEL_W }}
                    >
                      <span className="h-3 w-1 rounded-full" style={{ background: g.account.color }} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-navy-800">{g.account.name}</p>
                        <p className="truncate text-[11px] text-navy-700/60">{g.account.owner}</p>
                      </div>
                    </div>

                    {/* Rows */}
                    <div className="relative" style={{ width: domain.width, height: g.items.length * ROW_HEIGHT }}>
                      {/* week gridlines */}
                      {weeks.map((w) => (
                        <div key={w.iso} className="absolute inset-y-0 w-px bg-navy-50" style={{ left: w.x }} />
                      ))}
                      {/* today marker */}
                      {tX >= 0 && tX <= domain.width && (
                        <div className="absolute inset-y-0 z-10 w-px bg-accent/70" style={{ left: tX }}>
                          <span className="absolute -top-px left-1 rounded-sm bg-accent px-1 text-[9px] font-bold text-white">
                            TODAY
                          </span>
                        </div>
                      )}
                      {g.items.map((ws, i) => (
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedId && <WorkstreamPanel workstreamId={selectedId} onClose={() => setSelectedId(null)} />}
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
