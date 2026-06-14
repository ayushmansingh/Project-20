import { getStore } from '@netlify/blobs';

// Client ID and Playlist ID are public by design — safe as defaults.
// The Client Secret and Admin Password are SECRET — set them in Netlify env vars.
export const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || 'c6e7e6737a1e473798dd377e9edad602';
export const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';
export const PLAYLIST = process.env.SPOTIFY_PLAYLIST_ID || '0GLjDFwQz7g4RjZZhntzcZ';

const basic = () =>
  'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

export function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

// App-only token (Client Credentials) — used for search + reading a public playlist.
export async function appToken() {
  const r = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', authorization: basic() },
    body: 'grant_type=client_credentials',
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('app_token_failed: ' + JSON.stringify(j));
  return j.access_token;
}

// User token (from the couple's stored refresh token) — used for add + remove.
export async function userToken() {
  const store = getStore('spotify');
  const refresh = await store.get('refresh_token');
  if (!refresh) throw new Error('not_connected');
  const r = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', authorization: basic() },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refresh }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('refresh_failed: ' + JSON.stringify(j));
  return j.access_token;
}
