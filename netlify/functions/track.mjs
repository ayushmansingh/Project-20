import { getStore } from '@netlify/blobs';

// Silent, first-party visit analytics — no cookies, no third-party script.
// Geo is resolved server-side from the request's IP by Netlify's edge
// (context.geo), so the browser never shows a location permission prompt.
// The client only ever sends a random per-tab session id + which of a
// fixed set of section ids scrolled into view.

const SECTIONS = new Set(['top', 'story', 'events', 'venue', 'travel', 'gallery', 'games', 'album', 'rsvp']);
const MAX_EVENTS = 4000;

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

export default async (req, context) => {
  if (req.method !== 'POST') return json(405, { error: 'method' });
  let b;
  try { b = await req.json(); } catch { return json(400, { error: 'bad_json' }); }

  const sid = String(b.sid || '').slice(0, 64);
  const type = b.type === 'visit' || b.type === 'section' ? b.type : null;
  if (!sid || !type) return json(400, { error: 'bad_request' });
  const section = type === 'section' ? String(b.section || '') : null;
  if (type === 'section' && !SECTIONS.has(section)) return json(400, { error: 'bad_section' });

  const geo = context.geo || {};
  const event = {
    ts: Date.now(),
    sid,
    type,
    section,
    country: geo.country?.name || null,
    city: geo.city || null,
  };

  const store = getStore('analytics');
  const list = (await store.get('events', { type: 'json' })) || [];
  list.push(event);
  await store.set('events', JSON.stringify(list.slice(-MAX_EVENTS)));

  return json(200, { ok: true });
};
