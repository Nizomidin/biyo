import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Visit } from '../src/lib/store';
import { STORAGE_KEYS, deleteWhere, getCollection, upsertItem } from './_kvStore';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const clinicId = req.query.clinicId as string;

  if (req.method === 'GET') {
    let visits = await getCollection<Visit>(STORAGE_KEYS.VISITS);
    if (clinicId) {
      visits = visits.filter((v) => v.clinicId === clinicId);
    }
    return res.status(200).json(visits);
  }

  if (req.method === 'POST') {
    const visit: Visit = {
      ...req.body,
      id: req.body.id || `visit_${Date.now()}_${Math.random()}`,
      createdAt: req.body.createdAt || new Date().toISOString(),
    };

    await upsertItem<Visit>(STORAGE_KEYS.VISITS, visit);
    return res.status(200).json(visit);
  }

  if (req.method === 'DELETE') {
    const id = req.query.id as string;
    if (id && clinicId) {
      await deleteWhere<Visit>(STORAGE_KEYS.VISITS, (v) => v.id === id && v.clinicId === clinicId);
    }
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

