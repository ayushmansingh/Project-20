import { getStore } from '@netlify/blobs';
import { CLIENT_ID, CLIENT_SECRET, PLAYLIST, json } from './lib/spotify.mjs';

// Diagnostic: who is connected, do they own the playlist, and what scopes were granted?
// Visit /.netlify/functions/me?pw=ADMIN_PASSWORD
export default async (req) => {
  const pw = new URL(req.url).searchParams.get('pw');
  const admin = process.env.ADMIN_PASSWORD;
  if (!admin) return json(503, { error: 'admin_not_configured' });
  if (pw !== admin) return json(401, { error: 'unauthorized' });

  const store = getStore('spotify');
  const refresh = await store.get('refresh_token');
  if (!refresh) return json(200, { connected: false, hint: 'Run auth-start to connect.' });

  const tr = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      authorization: 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
    },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refresh }),
  });
  const tj = await tr.json();
  if (!tj.access_token) return json(200, { connected: true, token_error: tj });
  const at = tj.access_token;

  const [meR, plR] = await Promise.all([
    fetch('https://api.spotify.com/v1/me', { headers: { authorization: 'Bearer ' + at } }),
    fetch(`https://api.spotify.com/v1/playlists/${PLAYLIST}?fields=name,public,collaborative,owner(id,display_name)`,
      { headers: { authorization: 'Bearer ' + at } }),
  ]);
  const me = await meR.json();
  const pl = await plR.json();

  return json(200, {
    connected: true,
    granted_scope: tj.scope || null,
    connected_account: { id: me.id || null, name: me.display_name || null, http: meR.status },
    playlist: {
      id: PLAYLIST,
      name: pl.name || null,
      public: pl.public ?? null,
      collaborative: pl.collaborative ?? null,
      owner_id: pl.owner?.id || null,
      owner_name: pl.owner?.display_name || null,
      http: plR.status,
    },
    you_own_it: me.id && pl.owner?.id ? me.id === pl.owner.id : null,
    can_modify_public: (tj.scope || '').includes('playlist-modify-public'),
    can_modify_private: (tj.scope || '').includes('playlist-modify-private'),
  });
};
