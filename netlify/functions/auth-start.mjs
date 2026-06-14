import { CLIENT_ID, json } from './lib/spotify.mjs';

// One-time: the couple visits /.netlify/functions/auth-start?pw=ADMIN_PASSWORD
// to authorize the app to manage their playlist.
export default async (req) => {
  const u = new URL(req.url);
  const pw = u.searchParams.get('pw');
  const admin = process.env.ADMIN_PASSWORD;
  if (!admin) return json(503, { error: 'admin_not_configured' });
  if (pw !== admin) return new Response('Unauthorized', { status: 401 });

  const redirect = u.origin + '/.netlify/functions/auth-callback';
  const authUrl =
    'https://accounts.spotify.com/authorize?' +
    new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      scope: 'playlist-modify-public playlist-modify-private',
      redirect_uri: redirect,
      state: pw,
      show_dialog: 'true',
    });
  return new Response(null, { status: 302, headers: { location: authUrl } });
};
