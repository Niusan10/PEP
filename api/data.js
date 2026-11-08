import { put, get } from '@vercel/blob';
import { isAuthed, noStore, readJsonBody } from './_lib.js';

const PATH = 'pep/data.json';

async function streamToText(stream) {
  const reader = stream.getReader();
  const chunks = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req, res) {
  noStore(res);
  if (!isAuthed(req)) {
    res.status(401).json({ error: 'No autorizado' });
    return;
  }

  try {
    if (req.method === 'GET') {
      let result = null;
      try {
        result = await get(PATH, { access: 'private' });
      } catch (e) {
        if (!/not.?found|404/i.test(String(e && (e.name + e.message)))) throw e;
      }
      if (!result || result.statusCode !== 200 || !result.stream) {
        res.status(200).json({ data: null });
        return;
      }
      const text = await streamToText(result.stream);
      res.status(200).json({ data: JSON.parse(text) });
      return;
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const body = await readJsonBody(req);
      if (!body || typeof body.data !== 'object' || body.data === null) {
        res.status(400).json({ error: 'Datos no válidos' });
        return;
      }
      const data = { ...body.data, savedAt: new Date().toISOString() };
      await put(PATH, JSON.stringify(data), {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json',
      });
      res.status(200).json({ ok: true, savedAt: data.savedAt });
      return;
    }

    res.status(405).json({ error: 'Método no permitido' });
  } catch (e) {
    console.error('data error', e);
    res.status(500).json({ error: 'Error del servidor: ' + (e && e.message ? e.message : 'desconocido') });
  }
}
