# Wedding site — Google Photos setup

Guests upload photos on the site → they land in your Google Photos album automatically.
The Gallery section shows them live.

## One-time Google Cloud setup

### 1. Create a project & enable the API

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (e.g. "Wedding Site")
3. **APIs & Services → Library** → search **"Photos Library API"** → Enable

### 2. Create OAuth credentials

1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
2. Application type: **Web application**
3. Name: anything (e.g. "Wedding Site")
4. **Authorised redirect URIs** → add:
   ```
   https://dhwaniwedsayushman.netlify.app/.netlify/functions/gp-auth-callback
   ```
5. Click **Create** — copy the **Client ID** and **Client Secret**

### 3. Configure the consent screen

1. **APIs & Services → OAuth consent screen**
2. User type: **External**
3. Fill in app name, support email
4. Scopes: add `photoslibrary.appendonly` and `photoslibrary.readonly`
5. Test users: add your own Google account (the one that owns the Photos album)
6. Status stays **Testing** — that's fine for personal use (token lasts 7 days; reconnect weekly)

> To go permanent: publish the app and submit for Google verification (~2–3 days). Only needed if you want zero reconnects during the wedding period.

---

## Set env vars in Netlify

**Netlify → Site configuration → Environment variables** — add:

| Key | Value |
|-----|-------|
| `GOOGLE_CLIENT_ID` | from step 2 above |
| `GOOGLE_CLIENT_SECRET` | from step 2 above |

Redeploy after adding them.

---

## Connect your Google account (one-time)

Visit this URL in your browser (you must be logged into the right Google account):

```
https://dhwaniwedsayushman.netlify.app/.netlify/functions/gp-auth-start
```

Authorise the app → you'll see "✅ Google Photos connected!" and the album is created automatically.

---

## How it works after setup

- Guests tap **📷 Share a photo** in the Gallery section
- Photo uploads directly to your Google Photos album **"Dhwani & Ayushman — Wedding 2026"**
- The Gallery refreshes and shows real photos instead of placeholders
- You can also add, delete, or organise photos directly in the Google Photos app — changes appear on the site

## Reconnecting (Testing mode only)

If the token expires (7 days in Testing mode), just visit the auth-start URL again and re-authorise.
The album is remembered — no duplicate albums are created.
