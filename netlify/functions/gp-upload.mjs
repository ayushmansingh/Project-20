import { getStore } from '@netlify/blobs';
import { getAccessToken, json } from './lib/google.mjs';

const SITE_HOST = new URL(process.env.URL || 'https://dhwaniwedsayushman.netlify.app').hostname;

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'method' });

  // Only accept requests originating from the wedding site itself
  const origin = req.headers.get('origin') || '';
  const referer = req.headers.get('referer') || '';
  const fromSite = origin.includes(SITE_HOST) || referer.includes(SITE_HOST);
  const fromLocalDev = origin.includes('localhost') || origin.includes('127.0.0.1');
  if (!fromSite && !fromLocalDev) return json(403, { error: 'forbidden' });

  const store = getStore('google');
  const [refreshTk, albumId] = await Promise.all([
    store.get('refresh_token'),
    store.get('album_id'),
  ]);
  if (!refreshTk) return json(503, { error: 'google_not_connected' });
  if (!albumId) return json(503, { error: 'album_not_found' });

  let fileBytes, fileName, mimeType;
  try {
    const form = await req.formData();
    const file = form.get('photo');
    if (!file || typeof file === 'string') return json(400, { error: 'no_file' });
    fileBytes = await file.arrayBuffer();
    fileName = file.name || 'photo.jpg';
    mimeType = file.type || 'image/jpeg';
  } catch (e) {
    return json(400, { error: 'bad_request', detail: String(e.message) });
  }

  if (fileBytes.byteLength > 8_000_000) return json(413, { error: 'too_large' });
  if (!mimeType.startsWith('image/')) return json(400, { error: 'not_an_image' });

  try {
    const token = await getAccessToken(refreshTk);

    const ur = await fetch('https://photoslibrary.googleapis.com/v1/uploads', {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + token,
        'content-type': 'application/octet-stream',
        'X-Goog-Upload-Content-Type': mimeType,
        'X-Goog-Upload-Protocol': 'raw',
        'X-Goog-Upload-File-Name': fileName,
      },
      body: fileBytes,
    });
    if (!ur.ok) return json(502, { error: 'upload_bytes_failed', status: ur.status });
    const uploadToken = await ur.text();

    const mr = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate', {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + token,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        albumId,
        newMediaItems: [{ simpleMediaItem: { uploadToken, fileName } }],
      }),
    });
    const mj = await mr.json();
    const result = mj.newMediaItemResults?.[0];
    if (result?.status?.code && result.status.code !== 0) {
      return json(502, { error: 'create_failed', detail: result.status.message });
    }

    return json(200, { ok: true });
  } catch (e) {
    return json(500, { error: String(e.message || e) });
  }
};
