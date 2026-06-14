# Wedding site — deploy & playlist setup

The site is a static page (`index.html`) plus a few **Netlify Functions** (`netlify/functions/`).

## ⚠️ About the playlist

Spotify **blocked playlist writes for hobby/development apps** (policy change, **May 2025** — see
[spotify-web-api-ts-sdk #159](https://github.com/spotify/spotify-web-api-ts-sdk/issues/159)). There is
no path for an individual to add songs to a playlist via the API anymore. So the feature is now:

- Guests **search Spotify and request** songs (search still works fine via an app token).
- Requests are saved to **Netlify Blobs** (no Spotify login, nothing auto-added).
- You open the **Curate · admin** panel on the site, review requests, tap **Open ↗** to open each in
  Spotify, and add the ones you like to your playlist by hand.
- The live **Spotify embed** on the page shows the playlist as you build it.

## Functions

| Function | Does | Auth |
|---|---|---|
| `search` | Searches Spotify | App token (Client ID + Secret) |
| `request` | Saves a song request to Blobs | none (guests) |
| `requests` | Lists requests | Admin password |
| `request-remove` | Deletes a request | Admin password |

## Deploy (Netlify)

Easiest now that it's on GitHub: Netlify → **Add new site → Import an existing project → GitHub →
Project-20**. Netlify installs deps and bundles the functions on every push.

(CLI alternative from this folder: `npm install && netlify deploy --build --prod`.)

## The only two env vars you need

Netlify → Site configuration → **Environment variables**:

| Key | Value |
|-----|-------|
| `SPOTIFY_CLIENT_SECRET` | your Spotify app's Client Secret (used only for search) |
| `ADMIN_PASSWORD` | any password — gates the Curate panel |

Redeploy after adding them. **No Spotify OAuth / redirect URI / "connect" step is needed anymore** —
those were only for the (now-blocked) auto-add.

## Test

- Site → **Playlist** → search a song → **Request** → "Requested ✓".
- **Curate · admin** → enter `ADMIN_PASSWORD` → **Load requests** → you'll see them, with **Open ↗** to
  add to Spotify and **Remove** to clear.
