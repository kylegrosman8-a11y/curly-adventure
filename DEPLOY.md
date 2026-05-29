# Deploying Account War Room to Vercel

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

## AI features (optional, later)

The five AI features (notes→updates, check-in summary, follow-up, HVA scoring,
MEDDPICC coach) need an Anthropic API key. The app runs fully **without** one
(they show "AI offline" and use built-in fallbacks).

To enable them you have two options:

1. **Quick but exposes the key** — in Vercel → Settings → Environment Variables,
   add `VITE_ANTHROPIC_API_KEY = sk-ant-...`. ⚠️ This is bundled into the
   browser app, so anyone using the site can read the key. Only acceptable for a
   private/internal URL.
2. **Recommended — serverless proxy** (no exposed key). We add a Vercel
   serverless function that holds the key server-side (`ANTHROPIC_API_KEY`) and
   the app calls that instead of Anthropic directly. This is a small follow-up
   change — ask and it'll be wired in.

## Custom domain (optional)

Vercel → Settings → Domains → add your domain and follow the DNS steps.
