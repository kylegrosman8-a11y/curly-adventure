// Markdown generation + .md file download helpers.
import { shortDate, todayISO } from './dates.js';
import { STATUSES, formatValue } from './status.js';

/** Trigger a browser download of `content` as `filename`. */
export function downloadMarkdown(filename, content) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.md') ? filename : `${filename}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Slugify text for filenames. */
export function slug(s) {
  return (s || 'export')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

/**
 * Deterministic check-in summary used as a fallback when the AI is unavailable,
 * and as the body saved into the CheckinSession.
 */
export function buildCheckinMarkdown({ memberName, date, touched }) {
  const moved = touched.filter((t) => t.beforeStatus !== t.afterStatus || t.beforePercent !== t.afterPercent || t.note);
  const blocked = touched.filter((t) => t.afterStatus === 'blocked');
  const actions = touched.flatMap((t) => (t.newActions || []).map((a) => ({ ...a, title: t.title })));

  const lines = [];
  lines.push(`# Check-in — ${memberName}`);
  lines.push(`_${shortDate(date || todayISO())}_`);
  lines.push('');

  if (moved.length) {
    lines.push('## What moved');
    for (const t of moved) {
      const bits = [`**${t.title}**`];
      if (t.beforeStatus !== t.afterStatus) {
        bits.push(`${STATUSES[t.beforeStatus]?.label} → ${STATUSES[t.afterStatus]?.label}`);
      }
      if (t.beforePercent !== t.afterPercent) bits.push(`${t.beforePercent}% → ${t.afterPercent}%`);
      lines.push(`- ${bits.join(' · ')}`);
      if (t.note) lines.push(`  - ${t.note}`);
    }
    lines.push('');
  }

  if (blocked.length) {
    lines.push('## Blocked / needs help');
    for (const t of blocked) lines.push(`- **${t.title}** — ${t.note || 'blocked'}`);
    lines.push('');
  }

  if (actions.length) {
    lines.push('## New actions (owner — due)');
    for (const a of actions) {
      lines.push(`- ${a.text} — ${a.owner || memberName}${a.due ? ` (due ${shortDate(a.due)})` : ''}`);
    }
    lines.push('');
  }

  if (!moved.length && !blocked.length && !actions.length) {
    lines.push('_No changes recorded this session._');
  }

  return lines.join('\n');
}

/** Deterministic follow-up message fallback. */
export function buildFollowUpMarkdown({ memberName, actions }) {
  const lines = [];
  lines.push(`Hi ${memberName.split(' ')[0]},`);
  lines.push('');
  lines.push("Here's what you committed to this week:");
  lines.push('');
  if (actions.length) {
    for (const a of actions) {
      lines.push(`- [ ] ${a.text}${a.due ? ` _(due ${shortDate(a.due)})_` : ''}`);
    }
  } else {
    lines.push('- Nothing new — nicely on top of things.');
  }
  lines.push('');
  lines.push('Shout if anything is blocked. Thanks!');
  return lines.join('\n');
}

/** A weekly agenda export across all accounts (Portfolio view export). */
export function buildPortfolioMarkdown({ accounts, workstreams, memberById }) {
  const lines = [];
  lines.push(`# Account War Room — Portfolio`);
  lines.push(`_${shortDate(todayISO())}_`);
  lines.push('');
  for (const acc of accounts) {
    const ws = workstreams.filter((w) => w.accountId === acc.id);
    if (!ws.length) continue;
    lines.push(`## ${acc.name}  ·  _lead ${acc.owner}_`);
    for (const w of ws) {
      const owner = memberById.get(w.ownerId)?.name || '—';
      lines.push(
        `- **${w.title}** — ${STATUSES[w.status]?.label}, ${w.percentComplete}% · ${owner} · ${formatValue(w.value)} · due ${shortDate(w.endDate)}`
      );
    }
    lines.push('');
  }
  return lines.join('\n');
}
