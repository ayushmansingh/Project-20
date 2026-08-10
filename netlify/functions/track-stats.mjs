import { getStore } from '@netlify/blobs';

// Admin-only view of the silent visit tracker. /track-stats?pw=ADMIN_PASSWORD

function esc(s) {
  return String(s || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

export default async (req) => {
  const pw = new URL(req.url).searchParams.get('pw');
  const admin = process.env.ADMIN_PASSWORD;
  if (!admin || pw !== admin) return new Response('Not found', { status: 404 });

  const store = getStore('analytics');
  const events = (await store.get('events', { type: 'json' })) || [];

  const sessions = {};
  for (const e of events) {
    const s = (sessions[e.sid] ||= { country: null, city: null, sections: new Set(), first: e.ts });
    if (e.country) s.country = e.country;
    if (e.city) s.city = e.city;
    if (e.type === 'section') s.sections.add(e.section);
    s.first = Math.min(s.first, e.ts);
  }
  const sessionList = Object.values(sessions).sort((a, b) => b.first - a.first);

  const byLocation = {};
  for (const s of sessionList) {
    const key = [s.city, s.country].filter(Boolean).join(', ') || 'Unknown';
    byLocation[key] = (byLocation[key] || 0) + 1;
  }
  const locRows = Object.entries(byLocation)
    .sort((a, b) => b[1] - a[1])
    .map(([loc, n]) => `<tr><td>${esc(loc)}</td><td>${n}</td></tr>`)
    .join('');

  const avgSections = sessionList.length
    ? (sessionList.reduce((sum, s) => sum + s.sections.size, 0) / sessionList.length).toFixed(1)
    : '0';

  const rows = sessionList
    .slice(0, 300)
    .map((s) => {
      const when = new Date(s.first).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
      const where = [s.city, s.country].filter(Boolean).join(', ') || '—';
      return `<tr><td>${esc(when)}</td><td>${esc(where)}</td><td>${s.sections.size}</td><td style="font-size:12px;color:#8a7360">${[...s.sections].map(esc).join(', ') || '—'}</td></tr>`;
    })
    .join('');

  const html = `<html><body style="font-family:Georgia,serif;padding:32px 24px;max-width:920px;margin:0 auto;background:#F6E9D2;color:#4A2418">
  <h2 style="color:#841B18;margin-bottom:4px">Visitor stats</h2>
  <p style="color:#6E7A3C">${sessionList.length} sessions · average ${avgSections} sections viewed</p>
  <h3 style="margin-top:32px">By location</h3>
  <table cellpadding="8" style="border-collapse:collapse;width:100%;background:#FBF3E4;border-radius:6px;overflow:hidden">
    <tr style="background:#EADFC4;text-align:left"><th>Location</th><th>Sessions</th></tr>
    ${locRows || '<tr><td colspan="2">No visits logged yet.</td></tr>'}
  </table>
  <h3 style="margin-top:32px">Recent sessions</h3>
  <table cellpadding="8" style="border-collapse:collapse;width:100%;background:#FBF3E4;border-radius:6px;overflow:hidden">
    <tr style="background:#EADFC4;text-align:left"><th>Time (IST)</th><th>Location</th><th># sections</th><th>Sections seen</th></tr>
    ${rows || '<tr><td colspan="4">No visits logged yet.</td></tr>'}
  </table>
  </body></html>`;

  return new Response(html, { status: 200, headers: { 'content-type': 'text/html' } });
};
