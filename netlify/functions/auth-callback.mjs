import { getStore } from '@netlify/blobs';
import { CLIENT_ID, CLIENT_SECRET } from './lib/spotify.mjs';

const page = (msg) =>
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
   <body style="font-family:system-ui,sans-serif;background:#841B18;color:#FBF3E4;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;margin:0">
   <div style="max-width:30rem;padding:2rem">${msg}</div></body>`;

export default async (req) => {
  const u = new URL(req.url);
  const code = u.searchParams.get('code');
  const state = u.searchParams.get('state');
  const admin = process.env.ADMIN_PASSWORD;
  if (!admin || state !== admin)
    return new Response(page('<h1>Couldn’t verify that request.</h1>'), {
      status: 401, headers: { 'content-type': 'text/html' },
    });

  const redirect = u.origin + '/.netlify/functions/auth-callback';
  const r = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      authorization: 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
    },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirect }),
  });
  const j = await r.json();
  if (!j.refresh_token)
    return new Response(page('<h1>Connection failed.</h1><pre style="white-space:pre-wrap">' + JSON.stringify(j) + '</pre>'), {
      status: 400, headers: { 'content-type': 'text/html' },
    });

  const store = getStore('spotify');
  await store.set('refresh_token', j.refresh_token);
  return new Response(
    page('<h1>Connected ✓</h1><p>Your wedding playlist is wired up. Guests can now add songs. You can close this tab.</p>'),
    { status: 200, headers: { 'content-type': 'text/html' } }
  );
};
