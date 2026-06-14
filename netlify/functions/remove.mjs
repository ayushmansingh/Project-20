import { userToken, PLAYLIST, json } from './lib/spotify.mjs';

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method' });
  let b;
  try { b = await req.json(); } catch { return json(400, { error: 'bad_json' }); }
  const admin = process.env.ADMIN_PASSWORD;
  if (!admin) return json(503, { error: 'admin_not_configured' });
  if ((b.password || '') !== admin) return json(401, { error: 'unauthorized' });
  if (!b.uri) return json(400, { error: 'bad_uri' });
  try {
    const token = await userToken();
    const r = await fetch(`https://api.spotify.com/v1/playlists/${PLAYLIST}/tracks`, {
      method: 'DELETE',
      headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
      body: JSON.stringify({ tracks: [{ uri: b.uri }] }),
    });
    if (!r.ok) return json(r.status, { error: await r.text() });
    return json(200, { ok: true });
  } catch (e) {
    const m = String(e.message || e);
    return json(m === 'not_connected' ? 503 : 500, { error: m });
  }
};
