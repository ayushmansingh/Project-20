import { appToken, PLAYLIST, json } from './lib/spotify.mjs';

export default async () => {
  try {
    const token = await appToken();
    const r = await fetch(
      `https://api.spotify.com/v1/playlists/${PLAYLIST}/tracks?limit=100&fields=items(track(uri,name,artists(name),album(images)))`,
      { headers: { authorization: 'Bearer ' + token } }
    );
    const j = await r.json();
    const items = (j.items || [])
      .filter((i) => i && i.track)
      .map((i) => ({
        uri: i.track.uri,
        name: i.track.name,
        artists: i.track.artists.map((a) => a.name).join(', '),
        img: (i.track.album.images.at(-1) || {}).url || '',
      }));
    return json(200, { items });
  } catch (e) {
    return json(500, { error: String(e.message || e) });
  }
};
