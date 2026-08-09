// Marriage Wordle — the answers live ONLY here (server-side), never in the browser.
// GET  -> { length, id }            (today's word length + day id; never the word)
// POST { guess } -> { pattern, win, length, id }   (per-letter colours only)

const WORDS = ['SAGAI', 'HALDI', 'PHERAS', 'GWALIOR'];

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

// Word of the day, rotating in IST so it flips at local midnight.
export function todayWord(now = Date.now()) {
  const ist = new Date(now + 5.5 * 3600 * 1000);
  const id = ist.toISOString().slice(0, 10); // YYYY-MM-DD in IST
  const dayNum = Math.floor(ist.getTime() / 86400000);
  const i = ((dayNum % WORDS.length) + WORDS.length) % WORDS.length;
  return { word: WORDS[i], id };
}

// Standard Wordle scoring with correct duplicate-letter handling.
export function score(guess, answer) {
  const n = answer.length;
  const res = new Array(n).fill('miss');
  const left = {};
  for (const c of answer) left[c] = (left[c] || 0) + 1;
  for (let i = 0; i < n; i++) {
    if (guess[i] === answer[i]) { res[i] = 'hit'; left[guess[i]]--; }
  }
  for (let i = 0; i < n; i++) {
    if (res[i] === 'hit') continue;
    const c = guess[i];
    if (left[c] > 0) { res[i] = 'present'; left[c]--; }
  }
  return res;
}

export default async (req) => {
  const { word, id } = todayWord();
  if (req.method === 'GET') {
    return json(200, { length: word.length, id });
  }
  if (req.method === 'POST') {
    let body = {};
    try { body = await req.json(); } catch {}
    const guess = String(body.guess || '').toUpperCase().replace(/[^A-Z]/g, '');
    if (guess.length !== word.length) return json(400, { error: 'length', length: word.length });
    const pattern = score(guess, word);
    return json(200, { pattern, win: pattern.every((p) => p === 'hit'), length: word.length, id });
  }
  return json(405, { error: 'method' });
};
