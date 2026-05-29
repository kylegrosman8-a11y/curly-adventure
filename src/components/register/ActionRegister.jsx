import { useMemo, useState } from 'react';
import { useStore, useLookups } from '../../store/store.jsx';
import { ACTION_STATUSES, formatValue } from '../../lib/status.js';
import { shortDate, isOverdue, daysBetween, todayISO } from '../../lib/dates.js';
import { Avatar, EmptyState } from '../shared/ui.jsx';
import { scoreHVAs, hasApiKey, AIError } from '../../lib/claude.js';
import { scoreLocally, localWhy } from './hva.js';

const COLUMNS = [
  { key: 'text', label: 'Action' },
  { key: 'account', label: 'Account' },
  { key: 'owner', label: 'Owner' },
  { key: 'dueDate', label: 'Due' },
  { key: 'status', label: 'Status' },
];

export default function ActionRegister() {
  const store = useStore();
  const { accountById, memberById, workstreamById } = useLookups();
  const [sort, setSort] = useState({ key: 'dueDate', dir: 'asc' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');

  // Decorate action items with derived display fields.
  const rows = useMemo(() => {
    return store.actionItems.map((a) => {
      const ws = a.workstreamId ? workstreamById.get(a.workstreamId) : null;
      const account = ws ? accountById.get(ws.accountId) : null;
      const owner = a.ownerId ? memberById.get(a.ownerId) : null;
      return {
        ...a,
        account: account?.name || '—',
        accountColor: account?.color,
        owner: owner?.name || 'Unassigned',
        value: ws?.value || 0,
        wsTitle: ws?.title || null,
      };
    });
  }, [store.actionItems, workstreamById, accountById, memberById]);

  const filtered = useMemo(() => {
    let r = rows;
    if (statusFilter !== 'all') r = r.filter((x) => x.status === statusFilter);
    if (ownerFilter !== 'all') r = r.filter((x) => x.ownerId === ownerFilter);
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...r].sort((a, b) => {
      const av = a[sort.key] ?? '';
      const bv = b[sort.key] ?? '';
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [rows, statusFilter, ownerFilter, sort]);

  function toggleSort(key) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));
  }

  return (
    <div className="h-full overflow-y-auto bg-navy-50/30">
      <div className="mx-auto max-w-6xl space-y-5 p-6">
        <HvaPanel rows={rows} />

        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-navy-100 px-4 py-2.5">
            <h2 className="text-sm font-semibold text-navy-800">Action register</h2>
            <div className="flex items-center gap-2">
              <select className="field !w-auto !py-1.5 text-xs" value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}>
                <option value="all">All owners</option>
                {store.team.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <select className="field !w-auto !py-1.5 text-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All statuses</option>
                {Object.values(ACTION_STATUSES).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState title="No action items" hint="Actions created in check-ins and side panels show up here." />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-100 bg-navy-50/40 text-left text-[11px] uppercase tracking-wide text-navy-700/60">
                  {COLUMNS.map((c) => (
                    <th key={c.key} className="cursor-pointer px-4 py-2 font-semibold hover:text-navy-800" onClick={() => toggleSort(c.key)}>
                      {c.label}
                      {sort.key === c.key && <span className="ml-1">{sort.dir === 'asc' ? '▲' : '▼'}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const overdue = isOverdue(r.dueDate) && r.status !== 'done';
                  return (
                    <tr key={r.id} className={`border-b border-navy-100 last:border-0 hover:bg-navy-50/40 ${overdue ? 'bg-red-50/50' : ''}`}>
                      <td className="px-4 py-2.5">
                        <p className={r.status === 'done' ? 'text-navy-700/50 line-through' : 'text-navy-800'}>{r.text}</p>
                        {r.wsTitle && <p className="text-[11px] text-navy-700/50">{r.wsTitle}</p>}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1.5">
                          {r.accountColor && <span className="h-2 w-2 rounded-full" style={{ background: r.accountColor }} />}
                          {r.account}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1.5">
                          <Avatar name={r.owner} size="sm" /> {r.owner}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {r.dueDate ? (
                          <span className={overdue ? 'font-semibold text-red-600' : 'text-navy-800'}>
                            {shortDate(r.dueDate)}
                            {overdue && <span className="ml-1 text-[10px] font-bold uppercase">overdue</span>}
                          </span>
                        ) : (
                          <span className="text-navy-700/40">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <select
                          className="rounded-md border border-navy-100 bg-white px-2 py-1 text-xs font-medium"
                          style={{ color: ACTION_STATUSES[r.status].color }}
                          value={r.status}
                          onChange={(e) => store.updateActionItem(r.id, { status: e.target.value })}
                        >
                          {Object.values(ACTION_STATUSES).map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// "This week's HVAs" — top 5 open items by value × urgency (AI feature 4 + fallback).
function HvaPanel({ rows }) {
  const [items, setItems] = useState(null); // [{id, why, ...row}]
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState('');

  const openItems = useMemo(() => rows.filter((r) => r.status !== 'done'), [rows]);

  async function compute() {
    setLoading(true);
    setNote('');
    const local = scoreLocally(openItems).slice(0, 5);

    if (!hasApiKey()) {
      setItems(local.map((i) => ({ ...i, why: localWhy(i) })));
      setNote('Ranked locally (AI offline).');
      setLoading(false);
      return;
    }
    try {
      const ranked = await scoreHVAs(
        openItems.map((i) => ({ id: i.id, text: i.text, account: i.account, value: i.value, dueDate: i.dueDate, status: i.status }))
      );
      const byId = new Map(openItems.map((i) => [i.id, i]));
      const merged = ranked
        .map((r) => (byId.has(r.id) ? { ...byId.get(r.id), why: r.why } : null))
        .filter(Boolean);
      // Fall back to local ordering if the model returned nothing usable.
      setItems(merged.length ? merged : local.map((i) => ({ ...i, why: localWhy(i) })));
    } catch (e) {
      setItems(local.map((i) => ({ ...i, why: localWhy(i) })));
      setNote(e instanceof AIError ? `AI unavailable — ranked locally. (${e.message})` : 'Ranked locally.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-navy-100 bg-navy-800 px-4 py-2.5 text-white">
        <div>
          <h2 className="text-sm font-semibold">This week's HVAs</h2>
          <p className="text-[11px] text-white/60">Top 5 by value × urgency</p>
        </div>
        <button className="btn-accent !py-1.5 text-xs" onClick={compute} disabled={loading || openItems.length === 0}>
          {loading ? 'Scoring…' : items ? 'Re-score' : 'Score HVAs'}
        </button>
      </div>
      <div className="p-4">
        {note && <p className="mb-2 text-[11px] text-navy-700/60">{note}</p>}
        {!items ? (
          <p className="text-sm text-navy-700/60">
            {openItems.length === 0
              ? 'No open actions to rank.'
              : 'Click “Score HVAs” to surface the highest-value actions for the week.'}
          </p>
        ) : (
          <ol className="space-y-2">
            {items.map((i, idx) => {
              const days = i.dueDate ? daysBetween(i.dueDate, todayISO()) : null;
              return (
                <li key={i.id} className="flex items-start gap-3 rounded-md border border-navy-100 px-3 py-2">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-navy-800">{i.text}</p>
                    <p className="text-[11px] text-navy-700/60">{i.why}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs font-semibold text-navy-800">{formatValue(i.value)}</p>
                    <p className={`text-[11px] ${days !== null && days < 0 ? 'font-semibold text-red-600' : 'text-navy-700/60'}`}>
                      {i.account}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
