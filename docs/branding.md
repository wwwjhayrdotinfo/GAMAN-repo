# PadTalk app branding

Applied from the supplied branding notes and `Pad Talk Logo.zip` (1.png: full lockup; 2.png: app icon). The supplied raster artwork is preserved, with surrounding margins trimmed and resized for web use. The app name remains PadTalk; the artwork retains its original “Pad Talk” wordmark.

- Cream #FFF6E9 surfaces, indigo #27366B text, burnt orange #BF4E17 primary actions.
- Leaf #2F6B3F vendor replies and success; chili #C62F24 reserved for spice. Errors use an explanatory text message on a neutral surface.
- Mitr headings, Anuphan UI, Sarabun vendor-facing Thai. Fonts are bundled through Fontsource, with Latin and Thai subsets, and precached by the PWA.
- Vendor orders use 40px Thai type on an indigo background.
- Home screen, page title and sharing metadata use “Every dish is a conversation.”
- `public/brand` contains the full logo and wordmark exports. `public/icons` contains 32, 180, 192 and 512px icons and a padded maskable version.

The source images have baked-in cream backgrounds and raster texture. These exports are not vector originals. Future transparent/vector files can replace them without changing the app flow.

Build with `npm run build`; Vercel deployment follows the normal connected-branch push. No Supabase changes are needed. Existing installed apps may retain the previous home-screen icon until their browser updates the installation metadata or the user reinstalls the shortcut.

The home-screen centre logo uses `public/brand/logo-transparent.webp`, made with the built-in imagegen tool. Edit prompt: remove the cream background (including negative spaces), output real transparency, and preserve the Pad Talk artwork, colours and exact lettering. The original logo remains available for sharing metadata.
