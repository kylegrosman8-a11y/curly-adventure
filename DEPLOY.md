# Deploying Account War Room

Two supported paths: **GitHub Pages** (no extra account — set up here) and
**Vercel** (needed if you want live AI via the serverless proxy).

---

## Option A — GitHub Pages (no extra account)

A workflow (`.github/workflows/deploy-pages.yml`) builds and deploys the app to
GitHub Pages on every push to `main`.

**One-time setup:** in the repo, go to **Settings → Pages → Build and deployment
→ Source** and choose **GitHub Actions**. (The workflow also tries to enable this
automatically; if the first run shows a Pages error, set it manually and re-run.)

After that, every push to `main` publishes to:

> **https://kylegrosman8-a11y.github.io/curly-adventure/**

To trigger a deploy without a new commit: **Actions → Deploy to GitHub Pages →
Run workflow**.

**Note on AI:** GitHub Pages is static-only, so the serverless AI proxy can't run
there — the app is fully usable with **AI offline**. For live AI, use Vercel
(Option B) or another host that supports serverless functions.

---

## Option B — Vercel (enables live AI)

The app is a static Vite single-page app (data lives in the browser via
IndexedDB), so hosting is just serving the built files. Vercel auto-detects the
Vite setup from `vercel.json`.

## First deploy (~2 minutes)

1. Go to **https://vercel.com** and **Sign in with GitHub**.
2. **Add New → Project**, then **Import** the `kylegrosman8-a11y/curly-adventure`
   repository.
3. Vercel auto-detects the settings from `vercel.json`:
   - Framework: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
   Leave them as-is.
4. Click **Deploy**. You'll get a live URL in ~1 minute.

### Which branch goes live?

- Vercel deploys your repo's **Production Branch** (default `main`) to the main
  URL, and creates a **Preview URL for every other branch / pull request**.
- The full app currently lives on the **`claude/loving-clarke-lOKCU`** branch
  (PR #1), not yet on `main`. So either:
  - **Merge PR #1 into `main`** — then the main URL serves the app, **or**
  - In **Vercel → Project → Settings → Git**, set the **Production Branch** to
    `claude/loving-clarke-lOKCU`, **or**
  - Just open the **Preview URL** Vercel creates for the branch/PR to see it live
    immediately without merging.

## Turning on the AI features (live, secure)

The five AI features (notes→updates, check-in summary, follow-up, HVA scoring,
MEDDPICC coach) need an Anthropic API key. The app runs fully **without** one
(they show "AI offline" and use built-in fallbacks).

A **serverless proxy** is already built in (`api/claude.js`) so the key stays on
the server and is never shipped to the browser. To enable live AI on Vercel:

1. **Get an Anthropic API key** at https://console.anthropic.com (Settings → API
   Keys). It looks like `sk-ant-...`.
2. In **Vercel → your project → Settings → Environment Variables**, add **two**:
   - `ANTHROPIC_API_KEY = sk-ant-...`  ← the real key, server-side only (no
     `VITE_` prefix, so it never reaches the browser).
   - `VITE_AI_PROXY = 1`  ← tells the app to route AI calls through the proxy.
3. **Redeploy** (Deployments → ⋯ → Redeploy, or push a commit). The "AI offline"
   badge disappears and the AI features call Claude live via `/api/claude`.

That's the recommended setup — the key is never exposed.

### Local development
`npm run dev` (plain Vite) does **not** run the serverless function. For local
AI you can either:
- run `vercel dev` (serves `/api/claude` locally; set `ANTHROPIC_API_KEY` +
  `VITE_AI_PROXY=1` in a local `.env`), or
- set `VITE_ANTHROPIC_API_KEY=sk-ant-...` in `.env` to call Anthropic directly
  from the browser (dev convenience only — never deploy with this).

## Custom domain (optional)

Vercel → Settings → Domains → add your domain and follow the DNS steps.
