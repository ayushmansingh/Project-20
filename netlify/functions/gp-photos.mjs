import { getStore } from '@netlify/blobs';
import { getAccessToken, json } from './lib/google.mjs';

export default async () => {
  const store = getStore('google');
  const [refreshTk, albumId] = await Promise.all([
    store.get('refresh_token'),
    store.get('album_id'),
  ]);
  if (!refreshTk || !albumId) return json(200, { photos: [] });

  try {
    const token = await getAccessToken(refreshTk);
    const r = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:search', {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + token,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ albumId, pageSize: 100 }),
    });
    if (!r.ok) return json(200, { photos: [] });
    const j = await r.json();
    const photos = (j.mediaItems || []).map((m) => ({
      id: m.id,
      url: m.baseUrl,
    }));
    return json(200, { photos });
  } catch (e) {
    return json(500, { error: String(e.message || e) });
  }
};
