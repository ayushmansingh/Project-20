import { appToken, json } from './lib/spotify.mjs';

export default async (req) => {
  const q = new URL(req.url).searchParams.get('q') || '';
  if (q.trim().length < 2) return json(200, { items: [] });
  try {
    const token = await appToken();
    const r = await fetch(
      'https://api.spotify.com/v1/search?type=track&limit=8&market=IN&q=' + encodeURIComponent(q),
      { headers: { authorization: 'Bearer ' + token } }
    );
    const j = await r.json();
    const items = (j.tracks?.items || []).map((t) => ({
      uri: t.uri,
      name: t.name,
      artists: t.artists.map((a) => a.name).join(', '),
      img: (t.album.images.at(-1) || {}).url || '',
      url: t.external_urls.spotify,
    }));
    return json(200, { items });
  } catch (e) {
    return json(500, { error: String(e.message || e) });
  }
};
