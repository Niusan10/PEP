import crypto from 'node:crypto';

const COOKIE = 'pep_session';
const MAX_AGE = 60 * 60 * 24 * 180; // 180 días

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error('SESSION_SECRET no configurado');
  return s;
}

function sign(payload) {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) {
    crypto.timingSafeEqual(ba, ba);
    return false;
  }
  return crypto.timingSafeEqual(ba, bb);
}

export function checkCredentials(email, password) {
  const okEmail = safeEqual(String(email || '').trim().toLowerCase(), String(process.env.AUTH_EMAIL || '').trim().toLowerCase());
  const okPass = safeEqual(String(password || ''), String(process.env.AUTH_PASSWORD || ''));
  return okEmail && okPass && !!process.env.AUTH_PASSWORD;
}

export function createSessionCookie() {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE;
  const payload = `v1.${exp}`;
  const token = `${payload}.${sign(payload)}`;
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`;
}

export function clearSessionCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function isAuthed(req) {
  const raw = req.headers.cookie || '';
  const match = raw.split(/;\s*/).find((c) => c.startsWith(COOKIE + '='));
  if (!match) return false;
  const token = match.slice(COOKIE.length + 1);
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const payload = `${parts[0]}.${parts[1]}`;
  if (!safeEqual(sign(payload), parts[2])) return false;
  return Number(parts[1]) > Math.floor(Date.now() / 1000);
}

export function noStore(res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
}

export async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const txt = Buffer.concat(chunks).toString('utf8');
  return txt ? JSON.parse(txt) : {};
}
