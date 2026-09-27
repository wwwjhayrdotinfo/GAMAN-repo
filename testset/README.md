# Menu scan test set

Labelled menu photos for measuring how well a scan finds dishes, reads their Thai names and
links them to `src/data/dish-library.json`.

## ⚠️ Rule: `test/` is frozen

| Folder | What it is for |
|--------|----------------|
| `dev/` | Look at it, debug on it, tune prompts / match rules / the dish list against it. |
| `test/` | **Do not tune on it.** No prompt, match-rule, dish-list or label change may be made *because of* a `test/` result, and do not add its dishes to the library to raise the score. Run it only to report numbers (e.g. for the pitch) or to check that a big change (model switch, shorter prompt) did not regress. |

This applies to humans and agents alike. If you need more tuning data, add photos to `dev/`.
New, **unseen** photos may be added to `test/` (label them before running the scan on them).
The Kaprow Sanpakoi and Wua Thong photos are in `dev/` because the matcher was already tuned on Kaprow.
The Khoei board (a low-res 828×620 Google Maps screenshot of a bilingual Northern menu, right edge cut off)
is in `dev/` because it was already scanned and discussed before labelling.

## Contents

| Split | Photos | Labelled dishes | Expected to match the library |
|-------|--------|-----------------|-------------------------------|
| dev   | 3 | 39 | 19 |
| test  | 6 | 101 | 45 |

`test/` covers: handwritten Thai + Chinese wall board (Chiang Rai), bilingual close-ups with glare and
cut-off lines, an English-only Chiang Mai khao soi menu with option steps, and two English-only
Thai menus from a UK restaurant. **Gaps:** no whiteboard, no dark photos, few Thai-only printed
menus, few Northern dishes. It is a starter set; the target is 10–15 photos.

## Labels

Each `NAME.jpg` has a `NAME.labels.json`:

- `dishes[]`: every dish visible in the photo: `thai` (as written, `null` if the menu has no Thai),
  `english`, `price`, `expected_library_id` (the library dish it *is*, or `null`), optional
  `also_ok` (other acceptable library ids), `uncertain` (hard to read), `partial` (cut off).
- `non_dishes[]`: lines that must **not** become dish cards (add-ons like "ไข่ดาว 15", options,
  English glosses, headers).
- `label_status`: all labels are currently **draft: needs Thai-reader verification**.
  A Thai reader should check the Thai names and set this to `verified`.

## Scoring

```sh
npm run score:testset                  # dev
npm run score:testset -- --split test  # frozen test split, report only
npm run score:testset -- --image kaprow-sanpakoi
```

Runs the real app code (`analyzeMenu`, including extraction and library reuse) against the live Supabase function and prints,
per photo and overall: dishes found, exact Thai names, library matches (correct / wrong / missed /
false link), add-ons shown as dishes, and scan time. The app returns at most 40 dishes per scan.

Photo sources and licences: see `ATTRIBUTION.md`.
