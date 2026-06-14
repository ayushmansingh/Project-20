import { getStore } from '@netlify/blobs';
import { json } from './lib/spotify.mjs';

// Admin: remove a song request. POST { uri, password }
export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method' });
  let b;
  try { b = await req.json(); } catch { return json(400, { error: 'bad_json' }); }
  const admin = process.env.ADMIN_PASSWORD;
  if (!admin) return json(503, { error: 'admin_not_configured' });
  if ((b.password || '') !== admin) return json(401, { error: 'unauthorized' });
  const store = getStore('requests');
  let list = (await store.get('list', { type: 'json' })) || [];
  list = list.filter((x) => x.uri !== b.uri);
  await store.set('list', JSON.stringify(list));
  return json(200, { ok: true });
};
