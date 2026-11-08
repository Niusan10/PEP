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

function yearIsEmpty(y) {
  if (!y) return true;
  const objs = Object.values(y.objetivos || {}).flat().some((g) => g && String(g.text || '').trim());
  const lists = ['habitos', 'viajes', 'oscuridad', 'felicidad', 'dar', 'pesos', 'felizCuando'].some((k) => (y[k] || []).length);
  return !objs && !lists && !y.lema;
}

// Carga inicial privada desde la variable de entorno PEP_SEED (no está en el repositorio).
// Solo rellena los años que estén vacíos y solo una vez por seedId.
async function applySeed(data) {
  const raw = process.env.PEP_SEED;
  if (!raw) return null;
  let seed;
  try { seed = JSON.parse(raw); } catch { return null; }
  if (!seed || !seed.years) return null;
  const current = data && data.years ? data : { version: 1, years: {} };
  const applied = current.seedsApplied || [];
  if (seed.seedId && applied.includes(seed.seedId)) return null;
  let changed = false;
  for (const [yr, yd] of Object.entries(seed.years)) {
    if (yearIsEmpty(current.years[yr])) { current.years[yr] = yd; changed = true; }
  }
  current.seedsApplied = applied.concat(seed.seedId || 'seed');
  current.savedAt = new Date().toISOString();
  await put(PATH, JSON.stringify(current), {
    access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json',
  });
  console.log('seed', seed.seedId, changed ? 'aplicado' : 'omitido (años con datos)');
  return current;
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
      let data = null;
      if (result && result.statusCode === 200 && result.stream) {
        data = JSON.parse(await streamToText(result.stream));
      }
      const seeded = await applySeed(data);
      res.status(200).json({ data: seeded || data });
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
