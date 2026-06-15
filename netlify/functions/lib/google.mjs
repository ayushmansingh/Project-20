export const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
export const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
export const REDIRECT_URI =
  (process.env.URL || 'http://localhost:8888') + '/.netlify/functions/gp-auth-callback';

export async function getAccessToken(refreshTk) {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: refreshTk,
      grant_type: 'refresh_token',
    }),
  });
  const j = await r.json();
  if (!j.access_token)
    throw new Error('Google token refresh failed: ' + (j.error_description || j.error || JSON.stringify(j)));
  return j.access_token;
}

export function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
