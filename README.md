# Account War Room

A single-page operating-rhythm tool for a strategic account seller running weekly
team check-ins across enterprise accounts. The weekly check-in is the input event;
the Gantt, action register, and follow-ups all update from it.

## Stack

- **React + Vite** single-page app
- **TailwindCSS** for styling (navy `#1a2b4a` primary, orange `#e8833a` accent)
- **IndexedDB** via the `idb` wrapper for local persistence — data survives reloads
  with no backend
- Custom **SVG/CSS Gantt** (no charting library) for full control
- **Anthropic API** for the four AI features

## Getting started

```bash
npm install
cp .env.example .env   # optional: add your Anthropic key
npm run dev
```

Open the printed local URL. On first run the app seeds eight accounts (NAB,
Kelsian, Canva, Crown Resorts, Hungry Jack's/COMGROUP, GYG, Nine Entertainment,
Seven West Media) with sample workstreams, notes, and action items so all three
views render immediately. Use **Reset demo data** in the header to restore it.

### AI features (optional)

The four AI features call the Anthropic API directly from the browser. Set the
key in `.env`:

```
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

**Everything works offline except the four AI features.** When no key is set (or
a call fails) the app shows an "AI offline" badge and every workflow degrades to
manual entry / a deterministic local computation — the AI never blocks you.

## The three views

1. **Portfolio Gantt** (default) — swimlanes grouped by account, bars coloured by
   RAG status showing title, owner initials and % complete. Workstreams untouched
   for >10 days get a red stale dot. Drag a bar to shift dates, drag an edge to
   resize. Click a bar for a detail side panel (notes timeline + action items).
   Filter by account / member / status.
2. **Check-in Mode** — pick a team member to see only their workstreams as a
   checklist with one-click status, a % slider, and inline notes (all refresh
   `lastTouched`). Paste raw notes → AI extracts structured updates → review diff →
   apply. "End check-in" generates a summary + follow-up message and saves the
   session.
3. **Action Register** — sortable/filterable table of every action across accounts
   with overdue flags, plus a "This week's HVAs" panel ranking the top 5 items by
   value × urgency.

## AI features

All four use model `claude-sonnet-4-20250514`, `max_tokens` 1500, via a single
`callClaude(systemPrompt, userContent)` helper (`src/lib/claude.js`). Features 1
and 4 instruct the model to return JSON only and parse defensively (strip fences,
try/catch).

1. **Notes → structured updates** — maps mentions to the closest workstream,
   infers status from language, extracts commitments as actions with ISO dates.
2. **Check-in summary** — terse exec Markdown: What moved / Blocked / New actions.
3. **Follow-up message** — a warm, paste-ready DM with the member's commitments.
4. **HVA scoring** — ranked top 5 with a one-line "why this matters" each.

## Markdown export

Summaries, follow-up messages, and a full portfolio agenda export to downloadable
`.md` files (`src/lib/markdown.js`).

## Project layout

```
src/
  db/        IndexedDB wrapper + seed data
  store/     in-memory store (React context) with write-through persistence
  lib/       dates, status, Anthropic client, markdown helpers
  components/
    gantt/     Portfolio Gantt, draggable bars, timeline math, side panel
    checkin/   Check-in Mode, paste-notes AI panel, end-of-checkin modal
    register/  Action Register + HVA panel + local scoring
    shared/    small UI primitives
```
