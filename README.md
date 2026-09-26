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

## Claude API key

GitHub Pages is static, so there is **no key in the code**. Three options:

- **Quick (hackathon):** open ⚙️ Settings in the app and paste your key. It's stored in that browser's localStorage only and sent directly to `api.anthropic.com`.
- **Supabase (recommended):** follow [the setup guide](supabase/README.md). The Anthropic key stays in Supabase secrets; paste the function URL and proxy access token into Settings.
- **Cloudflare alternative:** deploy `proxy/worker.js` as a Cloudflare Worker with the key as a secret, then put the Worker URL in Settings → Proxy URL.

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
    SettingsScreen.jsx     API key / proxy / model
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
