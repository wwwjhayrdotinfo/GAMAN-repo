# Dish-specific ordering options

Each demo/library dish has an explicit `allowed_options` array. Supported IDs are `spice`, `no-coriander`, `fried-egg`, and `less-sweet`. An empty array hides optional controls; quantity, location and polite ending remain available.

The defaults are conservative suggestions, not promises about a vendor's kitchen. Prepared soups/curries and desserts have no assumed customisations. Thai tea offers less sweet; pad kra pao offers spice and fried egg. Review the library arrays with a local food/Thai speaker when expanding choices.

New AI details request this field. Exact library matches take precedence; base variants inherit their library options. Legacy/unknown cards without a valid array offer no customisations. Both the UI and sentence builder filter choices. The Edge Function rejects incomplete or malformed full cards from its cache/catalog; partial variant details remain separate from full products.

## Release

1. Redeploy `supabase/functions/anthropic/index.ts` to the existing `anthropic` Edge Function (user-managed deployment).
2. Push the frontend changes to the branch connected to Vercel.
3. Installed PWA users accept the update when ready.

No SQL migration or secret changes. The new request schema/prompts produce different cache keys for detail requests. Names-only scanning and its 40-item cache limit remain intact.

## Checks

- `npm run validate:dishes`
- `node scripts/test-order-options.mjs`
- `node scripts/test-scan-pipeline.mjs`
- `deno test --allow-env --allow-net supabase/functions/anthropic/index_test.ts`
- `npm run build`
