// Vercel serverless function: proxies the Anthropic Messages API.
// The API key lives ONLY on the server (env var ANTHROPIC_API_KEY) and is never
// shipped to the browser. The client posts { system, userContent } here.
const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 1500;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: { message: 'Method not allowed' } });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: { message: 'ANTHROPIC_API_KEY is not configured on the server.' } });
    return;
  }

  try {
    // Vercel parses JSON bodies automatically, but guard for safety.
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const { system, userContent, max_tokens, model } = body;

    if (!userContent) {
      res.status(400).json({ error: { message: 'Missing userContent.' } });
      return;
    }

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || MODEL,
        max_tokens: max_tokens || MAX_TOKENS,
        system,
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    const data = await upstream.json();
    // Pass the Anthropic response (and status) straight through.
    res.status(upstream.status).json(data);
  } catch (e) {
    res.status(502).json({ error: { message: `Proxy error: ${e?.message || e}` } });
  }
}
