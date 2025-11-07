import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Clinic } from '../src/lib/store';
import { STORAGE_KEYS, findItem, getCollection, upsertItem } from './_kvStore.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const id = req.query.id as string;

  if (req.method === 'GET') {
    if (id) {
      const clinic = await findItem<Clinic>(STORAGE_KEYS.CLINICS, (c) => c.id === id);
      return res.status(200).json(clinic || null);
    } else {
      const clinics = await getCollection<Clinic>(STORAGE_KEYS.CLINICS);
      return res.status(200).json(clinics);
    }
  }

  if (req.method === 'POST') {
    const clinic: Clinic = {
      ...req.body,
      id: req.body.id || `clinic_${Date.now()}_${Math.random()}`,
      createdAt: req.body.createdAt || new Date().toISOString(),
    };

    await upsertItem<Clinic>(STORAGE_KEYS.CLINICS, clinic);
    return res.status(200).json(clinic);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

