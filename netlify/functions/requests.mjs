import { getStore } from '@netlify/blobs';
import { json } from './lib/spotify.mjs';

// Admin: list all song requests. /requests?pw=ADMIN_PASSWORD
export default async (req) => {
  const pw = new URL(req.url).searchParams.get('pw');
  const admin = process.env.ADMIN_PASSWORD;
  if (!admin) return json(503, { error: 'admin_not_configured' });
  if (pw !== admin) return json(401, { error: 'unauthorized' });
  const store = getStore('requests');
  const list = (await store.get('list', { type: 'json' })) || [];
  return json(200, { items: list });
};
