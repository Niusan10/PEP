import { checkCredentials, createSessionCookie, noStore, readJsonBody } from './_lib.js';

export default async function handler(req, res) {
  noStore(res);
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método no permitido' });
    return;
  }
  let body = {};
  try {
    body = await readJsonBody(req);
  } catch {
    res.status(400).json({ error: 'Petición no válida' });
    return;
  }
  // Pequeño retardo para frenar ataques de fuerza bruta
  await new Promise((r) => setTimeout(r, 400));
  if (!checkCredentials(body.email, body.password)) {
    res.status(401).json({ error: 'Email o contraseña incorrectos' });
    return;
  }
  res.setHeader('Set-Cookie', createSessionCookie());
  res.status(200).json({ ok: true });
}
