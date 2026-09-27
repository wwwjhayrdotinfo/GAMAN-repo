# PadTalk 🍜 Order like a local in Chiang Mai

**Goal:** Help newcomers in Chiang Mai understand local dishes and confidently order them in Thai, turning every meal at a local food spot into a real exchange with the vendor instead of a moment of confusion.

Mobile-first web app, hosted on Vercel. No app store required. AI calls can run through a Supabase Edge Function.

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

The app automatically calls the public Supabase `anthropic` function. Testers do not need an API key, proxy token, or connection settings. The Anthropic key is stored only in Supabase secrets. Supabase saves dish details and caches repeat dish-name lookups and identical menu images to avoid repeat AI calls.

See [the Supabase setup guide](supabase/README.md) to deploy or update the function. This endpoint is intentionally open during core-feature testing.

## Deploy (Vercel)

Use the connected Vercel project: build command `npm run build`, output directory `dist`. Push to the branch configured for your desired Vercel environment. The GitHub Pages deployment workflow has been removed.

See [launch setup](docs/launch-setup.md) for demo hosting and the sharing QR code.

## Install PadTalk (PWA)

After deploying to Vercel, open the HTTPS app URL on your phone. On iPhone, use Safari → Share → Add to Home Screen. On Android, use the browser's Install app option, or the Install PadTalk button in Settings when available. The installed app uses the full PadTalk name and opens in a standalone window.

After the first online visit finishes caching, the app shell, demo menu, built-in dishes, order builder and saved phrases are available offline. New AI scans require internet; speech availability depends on the device's Thai voices. API responses and menu photos are not cached by the service worker. Saved phrases remain in the same browser storage as before the rename.

Updates show an Update now / Later notice so users can finish their current order before reloading. The current icons are simple PadTalk text placeholders pending branding.

To test caching locally, run `npm run build` then `npm run preview`. Service workers are disabled during `npm run dev`. Installation requires HTTPS or localhost; a phone accessing a plain HTTP LAN address cannot use the full PWA installation flow. This frontend change does not require redeploying the Supabase function.

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
