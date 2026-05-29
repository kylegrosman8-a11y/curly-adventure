// Anthropic API client + the four AI features.
// Everything degrades gracefully: every feature throws a typed error the UI can
// catch so the user always falls back to manual entry — the AI never blocks the
// workflow.
import { resolveRelativeDate, todayISO } from './dates.js';

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 1500;
const ENDPOINT = 'https://api.anthropic.com/v1/messages';

export class AIError extends Error {
  constructor(message, { kind = 'unknown' } = {}) {
    super(message);
    this.name = 'AIError';
    this.kind = kind;
  }
}

export function hasApiKey() {
  return Boolean(import.meta.env.VITE_ANTHROPIC_API_KEY);
}

/**
 * Single helper that POSTs to the Messages API and returns concatenated text
 * blocks. systemPrompt is the system instruction; userContent is the user turn.
 */
export async function callClaude(systemPrompt, userContent) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AIError('No Anthropic API key configured (VITE_ANTHROPIC_API_KEY).', {
      kind: 'no_key',
    });
  }

  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        // Allow calling the API directly from the browser.
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [{ role: 'user', content: userContent }],
      }),
    });
  } catch (e) {
    throw new AIError(`Network error reaching Anthropic API: ${e.message}`, {
      kind: 'network',
    });
  }

  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body?.error?.message || JSON.stringify(body);
    } catch {
      detail = res.statusText;
    }
    throw new AIError(`Anthropic API error ${res.status}: ${detail}`, { kind: 'api' });
  }

  const data = await res.json();
  const text = (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');
  return text;
}

/** Strip ```json fences / prose and parse JSON defensively. */
export function parseJSON(text) {
  if (!text) throw new AIError('Empty response from model.', { kind: 'parse' });
  let cleaned = text.trim();
  // Remove ```json ... ``` or ``` ... ``` fences.
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  // If there's leading/trailing prose, grab the outermost JSON object/array.
  const firstBrace = cleaned.search(/[[{]/);
  const lastBrace = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new AIError(`Could not parse model JSON: ${e.message}`, { kind: 'parse' });
  }
}

// ---------------------------------------------------------------------------
// Feature 1: NOTES -> STRUCTURED UPDATES
// ---------------------------------------------------------------------------
export async function extractUpdates(rawNotes, workstreams) {
  const system = `You convert messy meeting notes about enterprise account workstreams into structured updates.
You are given the raw notes and the current list of workstreams (id, title, owner).
Map each mention to the CLOSEST workstream by title/owner. Infer status from language:
"slipped/behind/at risk" -> "slipping"; "stuck/waiting on/can't proceed/blocked" -> "blocked"; otherwise leave status unchanged.
Extract any commitments ("I'll...", "X will...", "follow up", "send", "chase") as actions.
For dates, resolve relative phrases ("next week", "by Friday", "in 3 days") to ISO YYYY-MM-DD. Today is ${todayISO()}.
Return ONLY JSON (no prose, no backticks) shaped exactly:
{"updates":[{"workstreamId":"...","newStatus":"on_track|slipping|blocked"?,"newPercent":0-100?,"noteText":"..."?}],
"newActions":[{"workstreamIdOrNull":"..."|null,"text":"...","ownerGuess":"...","dueGuess":"YYYY-MM-DD"}]}
Only include fields you have evidence for. Omit newStatus/newPercent/noteText when unknown.`;

  const wsList = workstreams
    .map((w) => `- id=${w.id} | title="${w.title}" | owner=${w.ownerName || ''}`)
    .join('\n');
  const user = `Current workstreams:\n${wsList}\n\nRaw notes:\n"""\n${rawNotes}\n"""`;

  const text = await callClaude(system, user);
  const json = parseJSON(text);

  // Normalise + resolve any non-ISO dues defensively.
  const updates = Array.isArray(json.updates) ? json.updates : [];
  const newActions = (Array.isArray(json.newActions) ? json.newActions : []).map((a) => ({
    workstreamIdOrNull: a.workstreamIdOrNull ?? null,
    text: a.text || '',
    ownerGuess: a.ownerGuess || '',
    dueGuess: /^\d{4}-\d{2}-\d{2}$/.test(a.dueGuess || '')
      ? a.dueGuess
      : resolveRelativeDate(a.dueGuess),
  }));
  return { updates, newActions };
}

// ---------------------------------------------------------------------------
// Feature 2: CHECK-IN SUMMARY (Markdown)
// ---------------------------------------------------------------------------
export async function summariseCheckin(touched) {
  const system = `You write a crisp executive check-in summary in Markdown.
Sections, in this order, omitting any that are empty:
## What moved
## Blocked / needs help
## New actions (owner — due)
Answer-first, terse, exec tone. Use bullet points. No preamble, no closing remarks. Return Markdown only.`;

  const lines = touched
    .map((t) => {
      const parts = [`- ${t.account} / ${t.title} (owner ${t.owner})`];
      if (t.beforeStatus !== t.afterStatus) parts.push(`status ${t.beforeStatus} -> ${t.afterStatus}`);
      if (t.beforePercent !== t.afterPercent) parts.push(`${t.beforePercent}% -> ${t.afterPercent}%`);
      if (t.note) parts.push(`note: ${t.note}`);
      if (t.newActions?.length) parts.push(`actions: ${t.newActions.join('; ')}`);
      return parts.join(' | ');
    })
    .join('\n');
  const user = `Workstreams touched this session, with before/after state:\n${lines}`;
  return callClaude(system, user);
}

// ---------------------------------------------------------------------------
// Feature 3: FOLLOW-UP MESSAGE (per member)
// ---------------------------------------------------------------------------
export async function followUpMessage(memberName, touched, actions) {
  const system = `You write a short, warm direct message a manager can paste to a team member after a weekly check-in.
Open with "Here's what you committed to this week" (adapt naturally). Then a clean markdown checklist of their action items with due dates.
Keep it friendly and brief. Return the message text only — no subject line, no signature placeholder beyond a simple sign-off.`;

  const items = actions.length
    ? actions.map((a) => `- ${a.text}${a.due ? ` (due ${a.due})` : ''}`).join('\n')
    : '(no new actions)';
  const moved = touched.map((t) => `- ${t.title}: ${t.afterStatus} @ ${t.afterPercent}%`).join('\n');
  const user = `Team member: ${memberName}\nWorkstreams we touched:\n${moved}\n\nTheir new commitments:\n${items}`;
  return callClaude(system, user);
}

// ---------------------------------------------------------------------------
// Feature 4: HVA SCORING (top 5)
// ---------------------------------------------------------------------------
export async function scoreHVAs(items) {
  const system = `You rank open action items by business impact for the week.
Score = normalized(parent workstream value) x urgency(days-to-due, sooner/overdue = more urgent).
Return ONLY JSON (no prose, no backticks):
{"ranked":[{"id":"<actionItemId>","why":"<one concise line on why this matters>"}]}
Return at most the top 5, most important first. Today is ${todayISO()}.`;

  const list = items
    .map(
      (i) =>
        `- id=${i.id} | text="${i.text}" | account=${i.account} | value=${i.value} | due=${i.dueDate || 'none'} | status=${i.status}`
    )
    .join('\n');
  const user = `Open action items:\n${list}`;
  const text = await callClaude(system, user);
  const json = parseJSON(text);
  const ranked = Array.isArray(json.ranked) ? json.ranked : [];
  return ranked.slice(0, 5);
}
