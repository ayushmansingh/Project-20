import { getStore } from '@netlify/blobs';
import { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } from './lib/google.mjs';

export default async (req) => {
  const params = new URL(req.url).searchParams;
  const code = params.get('code');
  if (!code) return new Response('Missing code', { status: 400 });

  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });
  const j = await r.json();
  if (!j.refresh_token) {
    return new Response(
      `<html><body style="font-family:sans-serif;padding:48px">
       <h2>❌ No refresh token returned</h2><pre>${JSON.stringify(j, null, 2)}</pre>
       <p>Make sure you haven't connected this Google account before (revoke access at
       <a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a>
       then try again).</p></body></html>`,
      { status: 500, headers: { 'content-type': 'text/html' } }
    );
  }

  const store = getStore('google');
  await store.set('refresh_token', j.refresh_token);

  // Create the wedding album (only on first connect; skip if already stored)
  let albumId = await store.get('album_id');
  if (!albumId) {
    const ar = await fetch('https://photoslibrary.googleapis.com/v1/albums', {
      method: 'POST',
      headers: {
        authorization: 'Bearer ' + j.access_token,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ album: { title: 'Dhwani & Ayushman — Wedding 2026' } }),
    });
    const album = await ar.json();
    if (album.id) {
      albumId = album.id;
      await store.set('album_id', albumId);
    }
  }

  return new Response(
    `<html><body style="font-family:sans-serif;text-align:center;padding:64px 24px;background:#F6E9D2">
    <h2 style="color:#841B18;font-size:2rem">✅ Google Photos connected!</h2>
    <p style="margin:12px 0 6px;color:#4A2418">Album: <b>Dhwani &amp; Ayushman — Wedding 2026</b></p>
    <p style="color:#6E7A3C;font-size:14px">Album ID: ${albumId || '(error creating album)'}</p>
    <p style="margin-top:28px"><a href="/" style="color:#841B18;font-size:1.1rem">← Back to the site</a></p>
    </body></html>`,
    { status: 200, headers: { 'content-type': 'text/html' } }
  );
};
