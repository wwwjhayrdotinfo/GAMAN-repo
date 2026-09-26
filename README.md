# GAMAN 🍜 Order like a local in Chiang Mai

**Goal:** Help newcomers in Chiang Mai understand local dishes and confidently order them in Thai, turning every meal at a local food spot into a real exchange with the vendor instead of a moment of confusion.

Mobile-first web app, hosted on GitHub Pages. No app store required. AI calls can run through a Supabase Edge Function.

## How it works

1. **Scan**: snap a menu (Thai, English, handwritten) or type a dish name. Claude vision turns it into dish cards.
2. **Understand**: each card shows the Thai name + pronunciation (🔊), what it is, what's inside, spice level, how locals eat it, and a line of cultural story.
3. **Order**: pick quantity, spice, extras, eat-in/takeaway, and polite ending (ครับ/ค่ะ). The app builds the Thai sentence from templates (instant, no AI call).
4. **Show the vendor**: a full-screen Thai view to flip toward the vendor, with **tap-to-reply buttons in Thai** ("sold out", "spicy?", "where are you from?"…). The customer sees the English and can answer back with quick phrases, including Kham Mueang (Northern Thai).
5. **My Thai**: save phrases you've used; they're stored in the browser.

The **demo menu** (10 Chiang Mai classics in `src/data/dishes.js`) works offline and without an API key.

## Run locally

```bash
npm install
npm run dev      # open the "Network" URL on your phone (same Wi-Fi)
npm run build    # production build → dist/
```

## AI connection

The app automatically calls the public Supabase `anthropic` function. Testers do not need an API key, proxy token, or connection settings. The Anthropic key is stored only in Supabase secrets.

See [the Supabase setup guide](supabase/README.md) to deploy or update the function. This endpoint is intentionally open during core-feature testing.

## Deploy (GitHub Pages)

1. Repo → **Settings → Pages → Source: GitHub Actions**.
2. Push to `main`. `.github/workflows/deploy.yml` builds and publishes.
3. The site is at `https://<owner>.github.io/GAMAN-repo/`.

## Project map

```
src/
  App.jsx                  screen state machine: scan → dishes → order → vendor
  components/
    ScanScreen.jsx         camera / type a dish / demo menu
    DishList.jsx           dish cards
    OrderScreen.jsx        order builder + Thai sentence
    VendorView.jsx         vendor-facing view + reply buttons + phrases
    MyThai.jsx             saved phrases
    SettingsScreen.jsx     polite ending preference
  lib/
    claude.js              menu → dishes (forced tool-use JSON)
    order.js               Thai order sentence templates
    speak.js               Thai text-to-speech (browser)
    image.js               client-side photo resize
  data/
    dishes.js              offline demo dishes
    phrases.js             phrases, vendor replies, quick answers
supabase/functions/anthropic/index.ts  Supabase Edge Function proxy
supabase/README.md        Supabase deployment and testing guide
proxy/worker.js            optional Cloudflare Worker proxy
```

## ⚠️ Before the demo

- Have a Thai speaker (ideally from Chiang Mai) check `src/data/phrases.js` and `src/data/dishes.js`, especially the **Kham Mueang** lines.
- Thai text-to-speech depends on the phone having a Thai voice (most iOS/Android devices do).
