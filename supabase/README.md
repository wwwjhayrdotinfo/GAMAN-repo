# Supabase Anthropic function

GAMAN automatically calls `https://mvbdtvwamydfojoetdca.supabase.co/functions/v1/anthropic`. Users can scan or type a dish without configuring credentials. The Anthropic API key stays in Supabase secrets. The model is selected server-side.

## Update the existing deployment

1. In Supabase → Edge Functions → **anthropic**, replace `index.ts` with [`functions/anthropic/index.ts`](functions/anthropic/index.ts) and deploy.
2. Keep **Verify JWT off**. The endpoint is intentionally public for core-feature testing.
3. Keep `ANTHROPIC_API_KEY` in Edge Function secrets. `GAMAN_PROXY_TOKEN` is no longer read and can be removed.
4. `ANTHROPIC_MODEL` is optional; the default is `claude-sonnet-4-5`.
5. Omit `ALLOWED_ORIGIN` to allow localhost, Vercel production, and preview URLs. If it is set, it must match the site's origin exactly (no path or trailing slash).
6. Push the frontend changes and let Vercel rebuild. Existing browser connection settings are ignored; no user setup is needed.

The frontend and function must both be updated: the old function still rejects requests without the proxy token.

## CLI deployment

```bash
supabase login
supabase functions deploy anthropic --project-ref mvbdtvwamydfojoetdca
```

For a new project, copy `supabase/.env.example` to `supabase/.env.local`, fill in the key, and use `supabase secrets set --project-ref YOUR_PROJECT_REF --env-file supabase/.env.local`. Update `MENU_API_URL` in `src/lib/settings.js` if moving to a different project. Never put the Anthropic key in frontend code or a `VITE_*` variable.

## Verification

```bash
deno check supabase/functions/anthropic/index.ts
deno test --allow-env supabase/functions/anthropic/index_test.ts
npm run build
```

Tests mock Anthropic and do not make paid calls. For local function development, run `supabase start` and `supabase functions serve anthropic --env-file supabase/.env.local`, and temporarily point `MENU_API_URL` at `http://127.0.0.1:54321/functions/v1/anthropic`.

## Testing limits

Anyone who knows the endpoint can make paid requests. There is no authentication or rate limiting in this testing setup. The handler still limits request bodies to 8 MiB, fixes output at 4096 tokens, and selects the model server-side. CORS origin restrictions do not authenticate callers.

Anthropic errors retain their HTTP status and response body; network failures return 502 and timeouts return 504.
