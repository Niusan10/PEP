import { isAuthed, noStore } from './_lib.js';

export default function handler(req, res) {
  noStore(res);
  res.status(200).json({ authed: isAuthed(req) });
}
