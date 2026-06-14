import { getStore } from '@netlify/blobs';
import { json } from './lib/spotify.mjs';

// Guests "request" a song -> stored in Netlify Blobs (Spotify blocks direct
// playlist writes for hobby apps, so the couple curates these into the playlist).
export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method' });
  let b;
  try { b = await req.json(); } catch { return json(400, { error: 'bad_json' }); }
  if (!b.uri || !/^spotify:track:[A-Za-z0-9]+$/.test(b.uri)) return json(400, { error: 'bad_uri' });

  const store = getStore('requests');
  const list = (await store.get('list', { type: 'json' })) || [];
  if (!list.find((x) => x.uri === b.uri)) {
    list.unshift({
      uri: b.uri,
      name: String(b.name || '').slice(0, 200),
      artists: String(b.artists || '').slice(0, 200),
      img: String(b.img || '').slice(0, 400),
      ts: Date.now(),
    });
    await store.set('list', JSON.stringify(list.slice(0, 800)));
  }
  return json(200, { ok: true });
};
