// Per-account executive roadmap export, modelled on the customer roadmap slide:
// an account-centric timeline grouped by phase, RAG-coded, with milestones and
// the three summary panels (Project/Resource, Benefits/Risks, Commercials/Asks).
import { STATUSES, normaliseStatus, formatValue } from './status.js';
import { disciplineLabel } from './functions.js';
import { shortDate, fromISO, toISO, daysBetween, addDays } from './dates.js';

function domainOf(workstreams, milestones) {
  const dates = [];
  for (const w of workstreams) {
    if (w.startDate) dates.push(w.startDate);
    if (w.endDate) dates.push(w.endDate);
  }
  for (const m of milestones) if (m.date) dates.push(m.date);
  if (!dates.length) {
    const t = toISO(new Date());
    return { start: addDays(t, -30), end: addDays(t, 60) };
  }
  dates.sort();
  return { start: addDays(dates[0], -7), end: addDays(dates[dates.length - 1], 7) };
}

function pct(dateISO, domain) {
  const span = Math.max(1, daysBetween(domain.end, domain.start));
  return (daysBetween(dateISO, domain.start) / span) * 100;
}

function monthTicks(domain) {
  const ticks = [];
  const start = fromISO(domain.start);
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cursor < start) cursor.setMonth(cursor.getMonth() + 1);
  const end = fromISO(domain.end);
  while (cursor <= end) {
    const iso = toISO(cursor);
    ticks.push({ left: pct(iso, domain), label: cursor.toLocaleDateString('en-AU', { month: 'short', year: '2-digit' }) });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return ticks;
}

function groupByPhase(workstreams) {
  const phases = [...new Set(workstreams.map((w) => w.phase || 'Unphased'))].sort();
  return phases.map((p) => ({ phase: p, items: workstreams.filter((w) => (w.phase || 'Unphased') === p) }));
}

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export function buildRoadmapHTML({ account, workstreams, milestones, memberById }) {
  const rm = account.roadmap || {};
  const headline = rm.headline || `${account.name} — Account Roadmap`;
  const domain = domainOf(workstreams, milestones);
  const ticks = monthTicks(domain);
  const groups = groupByPhase(workstreams);
  const todayLeft = pct(toISO(new Date()), domain);

  const legend = Object.values(STATUSES)
    .map((s) => `<span class="lg"><i style="background:${s.color}"></i>${esc(s.label)}</span>`)
    .join('');

  const gridLines = ticks
    .map((t) => `<div class="tick" style="left:${t.left}%"><span>${esc(t.label)}</span></div>`)
    .join('');

  const milestoneMarks = milestones
    .map(
      (m) =>
        `<div class="ms" style="left:${pct(m.date, domain)}%" title="${esc(m.label)} — ${esc(shortDate(m.date))}">★<span>${esc(m.label)}</span></div>`
    )
    .join('');

  const rows = groups
    .map((g) => {
      const bars = g.items
        .map((w) => {
          const left = pct(w.startDate, domain);
          const width = Math.max(2, pct(w.endDate, domain) - left);
          const color = STATUSES[normaliseStatus(w.status)].color;
          const owner = memberById.get(w.ownerId)?.name || '';
          return `<div class="row">
            <div class="rlabel"><span class="disc">${esc(disciplineLabel(w))}</span>${esc(w.title)}</div>
            <div class="track">
              <div class="bar" style="left:${left}%;width:${width}%;background:${color}">
                <span class="bartxt">${esc(w.title)} · ${w.percentComplete}%</span>
              </div>
            </div>
            <div class="rmeta">${esc(owner)} · ${esc(formatValue(w.value))} · ${esc(shortDate(w.endDate))}</div>
          </div>`;
        })
        .join('');
      return `<div class="phase"><div class="phead">${esc(g.phase)}</div>${bars}</div>`;
    })
    .join('');

  const panel = (title, items) =>
    `<div class="panel"><h3>${esc(title)}</h3>${
      items && items.length
        ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`
        : '<p class="empty">—</p>'
    }</div>`;

  const msList = milestones.length
    ? `<ul>${milestones
        .map((m) => `<li><b>${esc(m.label)}</b> — ${esc(shortDate(m.date))}${m.note ? `: ${esc(m.note)}` : ''}</li>`)
        .join('')}</ul>`
    : '<p class="empty">No milestones.</p>';

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(account.name)} Roadmap</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Inter', system-ui, Arial, sans-serif; margin: 0; color: #1a2b4a; background: #fff; }
  .wrap { padding: 28px 32px; max-width: 1400px; margin: 0 auto; }
  h1 { font-size: 22px; margin: 0 0 4px; color: #1a2b4a; }
  .sub { color: #5b6b86; font-size: 12px; margin-bottom: 14px; }
  .legend { display: flex; gap: 14px; flex-wrap: wrap; margin: 8px 0 16px; }
  .lg { font-size: 11px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; }
  .lg i { width: 12px; height: 12px; border-radius: 3px; display: inline-block; }
  .chart { border: 1px solid #dce3ef; border-radius: 8px; overflow: hidden; }
  .axis { position: relative; height: 22px; border-bottom: 1px solid #dce3ef; background: #f1f4f9; margin-left: 280px; }
  .tick { position: absolute; top: 0; height: 100%; border-left: 1px solid #dce3ef; padding-left: 4px; }
  .tick span { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #5b6b86; }
  .msrow { position: relative; height: 26px; margin-left: 280px; border-bottom: 1px dashed #dce3ef; background: #fffaf4; }
  .ms { position: absolute; top: 2px; transform: translateX(-50%); color: #e8833a; font-size: 13px; white-space: nowrap; }
  .ms span { font-size: 9px; color: #1a2b4a; margin-left: 2px; }
  .today { position: absolute; top: 0; bottom: 0; width: 2px; background: rgba(232,131,58,.8); z-index: 5; }
  .phase { border-bottom: 1px solid #eef2f8; }
  .phead { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #243a63; background: #f7f9fc; padding: 4px 10px; }
  .row { display: grid; grid-template-columns: 280px 1fr 0; align-items: center; min-height: 30px; }
  .rlabel { font-size: 12px; padding: 4px 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .disc { display: inline-block; font-size: 9px; font-weight: 700; text-transform: uppercase; color: #5b6b86; background: #eef2f8; border-radius: 3px; padding: 1px 4px; margin-right: 6px; }
  .track { position: relative; height: 22px; }
  .bar { position: absolute; top: 2px; height: 18px; border-radius: 4px; color: #fff; display: flex; align-items: center; }
  .bartxt { font-size: 10px; font-weight: 600; padding: 0 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .rmeta { display: none; }
  .panels { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 18px; }
  .panel { border: 1px solid #dce3ef; border-radius: 8px; padding: 12px 14px; }
  .panel h3 { font-size: 12px; text-transform: uppercase; letter-spacing: .03em; color: #1a2b4a; margin: 0 0 8px; border-bottom: 2px solid #e8833a; padding-bottom: 6px; }
  .panel ul { margin: 0; padding-left: 16px; }
  .panel li { font-size: 12px; margin-bottom: 6px; line-height: 1.35; }
  .panel .empty { color: #9aa7bd; font-size: 12px; }
  @media print { .noprint { display: none; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  .btn { background: #1a2b4a; color: #fff; border: 0; border-radius: 6px; padding: 8px 14px; font-weight: 600; cursor: pointer; }
</style></head>
<body><div class="wrap">
  <button class="btn noprint" onclick="window.print()" style="float:right">Print / Save PDF</button>
  <h1>${esc(headline)}</h1>
  <div class="sub">${esc(account.name)} · lead ${esc(account.owner)} · generated ${esc(shortDate(toISO(new Date())))}</div>
  <div class="legend">${legend}</div>
  <div class="chart">
    <div class="axis">${gridLines}<div class="today" style="left:${todayLeft}%"></div></div>
    <div class="msrow">${milestoneMarks}<div class="today" style="left:${todayLeft}%"></div></div>
    ${rows || '<div class="phead">No active streams.</div>'}
  </div>
  <div class="panels">
    ${panel('Project & Resource Plan', rm.resourcing)}
    <div class="panel"><h3>Benefits &amp; Risks</h3>
      <p style="font-size:11px;font-weight:700;margin:0 0 4px">Benefits</p>
      ${rm.benefits && rm.benefits.length ? `<ul>${rm.benefits.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : '<p class="empty">—</p>'}
      <p style="font-size:11px;font-weight:700;margin:8px 0 4px">Risks &amp; mitigation</p>
      ${rm.risks && rm.risks.length ? `<ul>${rm.risks.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : '<p class="empty">—</p>'}
    </div>
    <div class="panel"><h3>Commercials &amp; Asks</h3>
      ${rm.commercials && rm.commercials.length ? `<ul>${rm.commercials.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : '<p class="empty">—</p>'}
      <p style="font-size:11px;font-weight:700;margin:8px 0 4px">Asks</p>
      ${rm.asks && rm.asks.length ? `<ul>${rm.asks.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : '<p class="empty">—</p>'}
    </div>
  </div>
  <div class="panels" style="grid-template-columns:1fr"><div class="panel"><h3>Milestones</h3>${msList}</div></div>
</div></body></html>`;
}

/** Open the printable roadmap in a new tab. */
export function openRoadmap(args) {
  const html = buildRoadmapHTML(args);
  const w = window.open('', '_blank');
  if (!w) return false;
  w.document.open();
  w.document.write(html);
  w.document.close();
  return true;
}

/** Markdown version of the roadmap. */
export function buildRoadmapMarkdown({ account, workstreams, milestones, memberById }) {
  const rm = account.roadmap || {};
  const lines = [];
  lines.push(`# ${rm.headline || `${account.name} — Account Roadmap`}`);
  lines.push(`_${account.name} · lead ${account.owner} · ${shortDate(toISO(new Date()))}_`);
  lines.push('');
  for (const g of groupByPhase(workstreams)) {
    lines.push(`## ${g.phase}`);
    for (const w of g.items) {
      const owner = memberById.get(w.ownerId)?.name || '—';
      lines.push(
        `- **${w.title}** — ${disciplineLabel(w)} · ${STATUSES[normaliseStatus(w.status)].label} · ${w.percentComplete}% · ${owner} · ${formatValue(w.value)} · due ${shortDate(w.endDate)}`
      );
    }
    lines.push('');
  }
  if (milestones.length) {
    lines.push('## Milestones');
    for (const m of milestones) lines.push(`- **${m.label}** — ${shortDate(m.date)}${m.note ? `: ${m.note}` : ''}`);
    lines.push('');
  }
  const section = (title, items) => {
    if (!items || !items.length) return;
    lines.push(`## ${title}`);
    for (const i of items) lines.push(`- ${i}`);
    lines.push('');
  };
  section('Project & Resource Plan', rm.resourcing);
  section('Benefits', rm.benefits);
  section('Risks & mitigation', rm.risks);
  section('Commercials', rm.commercials);
  section('Asks', rm.asks);
  return lines.join('\n');
}
