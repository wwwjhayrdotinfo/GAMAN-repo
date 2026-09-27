# Supabase Anthropic function

GAMAN automatically calls `https://mvbdtvwamydfojoetdca.supabase.co/functions/v1/anthropic`. Users can scan or type a dish without configuring credentials. The Anthropic API key stays in Supabase secrets. The model is selected server-side.

## Update the existing deployment

1. First, open **SQL Editor** in your existing Supabase project and run the complete contents of [`migrations/202609260001_menu_cache.sql`](migrations/202609260001_menu_cache.sql) once. This creates the cache and product tables.
2. In Supabase → Edge Functions → **anthropic**, replace `index.ts` with [`functions/anthropic/index.ts`](functions/anthropic/index.ts) and deploy.
3. Keep **Verify JWT off**. The endpoint is intentionally public for core-feature testing.
4. Keep `ANTHROPIC_API_KEY` in Edge Function secrets. `GAMAN_PROXY_TOKEN` is no longer read and can be removed.
5. `ANTHROPIC_MODEL` is optional; the default is `claude-sonnet-4-5`.
6. Omit `ALLOWED_ORIGIN` to allow localhost, Vercel production, and preview URLs. If it is set, it must match the site's origin exactly (no path or trailing slash).
7. Push the frontend changes and let Vercel rebuild. Existing browser connection settings are ignored; no user setup is needed.

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

## Saved dishes and request caching

The existing Supabase database holds two tables:

- `menu_cache`: saved Anthropic responses, keyed by a SHA-256 fingerprint of the request, model, prompt, and schema. Typed dish names normalize case and whitespace. Text results are reused for 30 days; identical photo results for 7 days. Expired entries refresh on the next request.
- `products`: generated dish descriptions, ingredients, pronunciation, spice level, eating tips, and cultural context. Prices are excluded because they belong to a specific menu. Inspect these rows in Supabase Table Editor. Generated facts are not independently verified.

The function reads the cache before calling Anthropic and writes successful, complete dish results after a cache miss. No uploaded photo bytes or raw user prompts are saved in the database. Products are deduplicated by normalized Thai/English names, ingredients, model, and cache version. Menu prices stay in the request-specific result.

This first version reuses complete results for the same typed request or identical processed image. Different spellings (beyond case/spacing), translations, and new photographs can still trigger AI. It does not yet identify dishes in a new photo and then fetch their individual descriptions from the product catalog. Simultaneous first-time requests can also each call AI before the cache is populated.

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are supplied by the hosted Edge Function environment. The server credential stays in the function; browsers cannot directly read or write these tables. See [Supabase function environment variables](https://supabase.com/docs/guides/functions/secrets).

If the tables are missing or the database is unavailable, the function continues with Anthropic and logs a generic cache warning. The response header `X-Gaman-Cache` reports `HIT`, `MISS`, `SKIP` (incomplete/unusable result), `DISABLED` (no database configuration), or `UNAVAILABLE` (a save failed). In browser DevTools, repeating the same dish should change this from `MISS` to `HIT`.

To invalidate a result, delete its row from `menu_cache` in Table Editor. Editing `products` does not change previously cached responses. To clear all cached responses while keeping the catalog, run `delete from public.menu_cache;`. Expired rows are ignored automatically; optional maintenance can reclaim space with `delete from public.menu_cache where expires_at < now();`.
