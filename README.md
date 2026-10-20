# Fantasy HQ

Start/sit command center for all your Sleeper leagues, built as an installable phone app (PWA).

## Files
- `index.html` — the whole app
- `manifest.webmanifest` — app name, icon and full-screen settings
- `sw.js` — lets the app open offline and caches Sleeper's big player list for a day
- `icons/` — home-screen icons

## Put it on your phone
1. Host this folder anywhere that serves plain files over https (GitHub Pages, Netlify, Cloudflare Pages).
2. Open the link in Safari (iPhone) or Chrome (Android).
3. iPhone: Share → **Add to Home Screen**. Android: ⋮ → **Install app**.

The app remembers your Sleeper username and loads your leagues as soon as it opens.
