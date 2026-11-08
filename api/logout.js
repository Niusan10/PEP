import { clearSessionCookie, noStore } from './_lib.js';

export default function handler(req, res) {
  noStore(res);
  res.setHeader('Set-Cookie', clearSessionCookie());
  res.status(200).json({ ok: true });
}
