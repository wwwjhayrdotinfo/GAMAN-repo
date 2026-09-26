# Supabase Anthropic function

The `anthropic` function accepts GAMAN's existing Messages payload (including menu photos and tool schemas) and forwards it to Anthropic. The Anthropic API key stays server-side. No database or Supabase client library is needed.

## Deploy using the Supabase dashboard

1. Open your Supabase project → **Edge Functions** → create a function using the editor. Name it **anthropic**.
2. Replace its `index.ts` with the complete contents of [`functions/anthropic/index.ts`](functions/anthropic/index.ts), then deploy.
3. In Edge Function **Secrets**, add:
   - `ANTHROPIC_API_KEY`: your Anthropic API key.
   - `GAMAN_PROXY_TOKEN`: a long random token you generate, for example with `openssl rand -hex 32`.
   - `ALLOWED_ORIGIN` (optional): your website's origin, e.g. `https://your-name.github.io` — omit `/GAMAN-repo/` and any trailing slash. For local Vite use `http://localhost:5173`. When omitted, all origins are allowed, but the proxy token is still required.
   - `ANTHROPIC_MODEL` (optional): defaults to `claude-sonnet-4-5`.
4. In the function's settings, turn **Verify JWT** off. Authentication is handled by the function's required `x-proxy-token` header. Leaving JWT verification on will reject the app's requests before they reach the function.
5. Open GAMAN → **Settings**:
   - **Proxy URL:** `https://<project-ref>.supabase.co/functions/v1/anthropic`
   - **Proxy access token:** the same value as `GAMAN_PROXY_TOKEN`.
   - **Model:** the same value as `ANTHROPIC_MODEL`, or `claude-sonnet-4-5` by default.
   - Leave the **Claude API key** field empty and save.
6. Type `khao soi`, then try a menu photo. Both should return dish cards.

Rebuild/deploy the frontend too so the new proxy token field is available on your hosted site.

## Deploy using the CLI

From the repository root:

```bash
supabase login
cp supabase/.env.example supabase/.env.local
# Edit supabase/.env.local with real values. This file is gitignored.
supabase secrets set --project-ref YOUR_PROJECT_REF --env-file supabase/.env.local
supabase functions deploy anthropic --project-ref YOUR_PROJECT_REF
```

The checked-in `config.toml` disables platform JWT verification for this function. Do not put the Anthropic key or proxy token in frontend source, GitHub Pages build variables, or a `VITE_*` variable.

## Local verification

```bash
deno check supabase/functions/anthropic/index.ts
deno test --allow-env supabase/functions/anthropic/index_test.ts
supabase start
supabase functions serve anthropic --env-file supabase/.env.local
```

For the local function use `http://127.0.0.1:54321/functions/v1/anthropic` in app Settings, and set `ALLOWED_ORIGIN` to the origin of your local app (including the port), or omit it for local testing. Unit tests mock Anthropic; they make no paid API calls.

## Access and limits

This is a shared-token setup for a private demo or trusted users. Anyone given the proxy token can make paid requests, and the token is stored in that browser's localStorage. It is not a public-user authentication or rate-limiting system. For a public launch, add user authentication and persistent per-user quotas. An origin restriction alone does not authenticate callers.

The handler rejects missing/wrong tokens, allows only POST and CORS preflight, limits request bodies to 8 MiB, fixes the output budget at 4096 tokens, and uses the server-configured model. Anthropic errors retain their HTTP status and response body; network failures return 502 and timeouts return 504. A 401 saying `Invalid proxy access token` means the app token does not match the secret; a gateway JWT error means platform JWT verification is still enabled.

References: [Supabase deployment](https://supabase.com/docs/guides/functions/deploy), [function secrets](https://supabase.com/docs/guides/functions/secrets), [Anthropic Messages API](https://platform.claude.com/docs/en/api/messages/create).
