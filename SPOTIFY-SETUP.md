# Wedding site — deploy & Spotify setup

The site is a static page (`index.html`) plus a few **Netlify Functions** (in `netlify/functions/`)
that talk to Spotify securely. The playlist **search / add / remove** only work once the site is
deployed to Netlify with the secrets set. The Spotify **embed** (viewing the playlist) works anywhere.

What's already baked in (public, safe):
- Spotify **Client ID**: `c6e7e6737a1e473798dd377e9edad602`
- **Playlist ID**: `0GLjDFwQz7g4RjZZhntzcZ`

What YOU provide as secrets (never in code/chat):
- `SPOTIFY_CLIENT_SECRET` — from your Spotify app
- `ADMIN_PASSWORD` — any password you choose (gates the "Curate" panel + the one-time connect)

---

## 1. Deploy to Netlify (CLI — no GitHub needed)

From inside this folder (`Wedding/`):

```bash
npm install                 # installs @netlify/blobs
npm install -g netlify-cli  # one-time
netlify login               # opens browser, log in / sign up (free)
netlify init                # create & link a new site (accept defaults)
netlify deploy --build --prod
```

At the end it prints your live URL, e.g. `https://YOURSITE.netlify.app`.
(You can rename the site later in the Netlify dashboard → Site settings → Change site name.)

> Prefer GitHub? Push this folder to a repo, then "Add new site → Import from Git" in Netlify —
> it auto-installs deps and bundles the functions. Either path works.

## 2. Set the two secrets in Netlify

Netlify dashboard → your site → **Site configuration → Environment variables → Add a variable**:

| Key | Value |
|-----|-------|
| `SPOTIFY_CLIENT_SECRET` | (paste your Spotify Client Secret) |
| `ADMIN_PASSWORD` | (choose a password) |

Then redeploy so they take effect: `netlify deploy --build --prod`
(or Deploys → Trigger deploy in the dashboard).

## 3. Add the redirect URI in Spotify

developer.spotify.com/dashboard → your app → **Settings → Edit** → **Redirect URIs**, add EXACTLY:

```
https://YOURSITE.netlify.app/.netlify/functions/auth-callback
```

(Replace `YOURSITE` with your real Netlify site name.) Save.

## 4. Connect your Spotify (one time)

In your browser, visit:

```
https://YOURSITE.netlify.app/.netlify/functions/auth-start?pw=YOUR_ADMIN_PASSWORD
```

Log in with the Spotify account that **owns the playlist**, click **Agree**. You'll see
**"Connected ✓"**. That's it — guests can now add songs.

## 5. Test it

- Open your site → **Playlist** section → search a song → **Add** → it appears in the embed (give it a few seconds; Spotify caches embeds briefly).
- Click **Curate · admin** → enter `ADMIN_PASSWORD` → **Load** → **Remove** any song.

---

## How it works (for reference)

| Function | Does | Auth |
|---|---|---|
| `search` | Searches Spotify | App token (Client ID+Secret) |
| `add` | Adds a track to the playlist | Your stored refresh token |
| `playlist` | Lists current tracks | App token |
| `remove` | Removes a track | Admin password + refresh token |
| `auth-start` / `auth-callback` | One-time connect → stores refresh token in Netlify Blobs | Admin password |

Re-running step 4 anytime re-connects (e.g. if you ever revoke access in your Spotify account).

## Troubleshooting

- **Add says "isn't connected yet"** → finish step 4.
- **401 on connect / `INVALID_CLIENT: Invalid redirect URI`** → the URI in step 3 must match step 4's
  domain character-for-character (https, no trailing slash).
- **Search works but Add 403** → make sure you authorized with the account that *owns* the playlist.
