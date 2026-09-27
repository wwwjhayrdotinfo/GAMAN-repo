# Scanning optimization — progress report

Updated: September 27, 2026

Scope: menu photo preparation, AI processing, result reuse, and progressive display. This report describes the current repository implementation; it does not confirm which version is deployed on Vercel or Supabase.

## Completed

| Area | Change | Effect |
| --- | --- | --- |
| Photo preparation | Asynchronous JPEG encoding at quality 0.78; maximum 1400px edge and 1.15 megapixels; no upscaling | Reduces upload payload and avoids synchronous JPEG encoding blocking the interface |
| Immediate feedback | Loading starts before image preparation, with preparation and reading messages | Removes the initial period with no visible feedback |
| Initial progress bar | Animated indeterminate bar, with reduced-motion support | Shows ongoing activity without inventing an AI completion percentage |
| Names-first scan | Send the photo once to extract up to 12 dish names and prices | Avoids generating full descriptions during image reading |
| Library reuse | Exact matches use the bundled dish library; base-dish variants reuse tips and background while generating variant-specific details | Reduces repeated generation while retaining proteins and toppings |
| Progressive cards | Show names/prices after extraction; exact matches are immediately usable | Users can begin browsing before all descriptions finish |
| Small detail batches | Process two dishes per batch, with at most two batches in flight | Cards become ready incrementally; shows a ready-card count |
| Independent interaction | Ready dishes can be ordered while other cards load | Background updates do not pull users out of the order screen |
| Error handling | Failed batches show card-level errors; completed cards remain available | One failed request does not discard the entire menu |
| Request controls | Prevent duplicate scans; abort pending client requests when leaving the dish list for the scanner; apply request timeouts | Limits overlapping work and stale updates; client cancellation does not guarantee an already-started server call stops |
| Response caching | Cache complete results, names-only extraction, and valid partial variant results | Repeated matching requests can avoid another AI call |
| Background persistence | Register database saves with Supabase background tasks; save cache and products in parallel | Database writes no longer block the hosted response |
| Diagnostics | Browser photo/scan measurements and server timing/cache headers | Supports separating photo, cache, and AI delays |

## Measured results

Development photo: `testset/dev/kaprow-sanpakoi.jpg`.

| Trial | Total time | Notes |
| --- | ---: | --- |
| Original full-card request | 41.3s | Baseline |
| Experimental shorter descriptions | 42.5s | No observed improvement; reverted |
| Names-first trial | 36.7s | Before progressive batching |
| Names-first final scorer trial | 35.0s | About 15% faster than the baseline; before progressive batching |

The 35.0s trial spent approximately 12s extracting names/prices and 23s preparing details. It found all nine labeled dishes, matched six Thai names exactly, and incorrectly included one add-on as a dish.

These are a few runs on one development photo, not a reliable average or a mobile performance guarantee. The scoring script uses its own 1200px image preparation. These timings do not establish the benefit of the newer browser encoding, background database saves, or progressive batching. Time to first visible card and first orderable card for the progressive version have not yet been measured live.

## Verification completed

- Production frontend build passed after adding progressive loading and the initial progress bar.
- Photo dimension checks passed: aspect ratio, pixel/edge limits, no upscaling, invalid dimensions.
- Pipeline checks passed: exact reuse, variants, unfamiliar dishes, prices and original order, empty/truncated responses.
- Progressive checks passed: intermediate snapshots, stable card IDs, two-request concurrency limit, out-of-order completion, isolated batch failures.
- Edge Function checks passed: caching, expiry, model isolation, database failure fallback, background saves, and names-only/partial-result caching.

## Remaining verification and limits

1. Verify the latest frontend is deployed to Vercel and the latest function is deployed to Supabase. Repository completion alone does not verify either deployment.
2. On mobile, measure photo preparation, time to names/prices, time to first ready card, and time to all ready cards on several menus and network connections.
3. Verify live cache hits for repeat requests after background saves complete, and compare cold scans separately from cached scans.
4. Check small/handwritten Thai text after compression and monitor add-ons incorrectly recognized as dishes.
5. Progressive batching improves early usability but can increase request overhead and cost. Full completion is not guaranteed to be faster for unfamiliar menus.
6. Initial extraction still waits for a complete names/prices response. The progress bar indicates activity, not a measured percentage.
7. Immediate dish reuse uses the bundled library. Semantic matching against the Supabase product catalog is not implemented; different photos or spellings may still require AI.

## Relevant files

- `src/lib/image.js`: photo preparation.
- `src/lib/claude.js`: extraction, matching, detail batches, incremental updates.
- `src/App.jsx`: scan state, cancellation, progressive navigation.
- `src/components/ScanScreen.jsx` and `src/index.css`: initial loading messages and progress bar.
- `src/components/DishList.jsx`: placeholders, ready count, per-card results and failures.
- `supabase/functions/anthropic/index.ts`: caching, persistence, and server timing.
- `scripts/test-image.mjs`, `scripts/test-scan-pipeline.mjs`, and `supabase/functions/anthropic/index_test.ts`: automated checks.
