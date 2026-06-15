import { CLIENT_ID, REDIRECT_URI } from './lib/google.mjs';

const SCOPES = [
  'https://www.googleapis.com/auth/photoslibrary.appendonly',
  'https://www.googleapis.com/auth/photoslibrary.readonly',
].join(' ');

export default async (req) => {
  // Gate with ADMIN_PASSWORD — this is a one-time admin action
  const pw = new URL(req.url).searchParams.get('pw');
  const admin = process.env.ADMIN_PASSWORD;
  if (!admin || pw !== admin) return new Response('Not found', { status: 404 });
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('redirect_uri', REDIRECT_URI);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', SCOPES);
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  return Response.redirect(url.toString(), 302);
};
