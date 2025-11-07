import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Doctor } from '../src/lib/store';
import { STORAGE_KEYS, deleteWhere, getCollection, upsertItem } from './_kvStore.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const clinicId = req.query.clinicId as string;

  if (req.method === 'GET') {
    let doctors = await getCollection<Doctor>(STORAGE_KEYS.DOCTORS);
    if (clinicId) {
      doctors = doctors.filter((d) => d.clinicId === clinicId);
    }
    return res.status(200).json(doctors);
  }

  if (req.method === 'POST') {
    const doctor: Doctor = {
      ...req.body,
      id: req.body.id || `doctor_${Date.now()}_${Math.random()}`,
    };

    await upsertItem<Doctor>(STORAGE_KEYS.DOCTORS, doctor);
    return res.status(200).json(doctor);
  }

  if (req.method === 'DELETE') {
    const id = req.query.id as string;
    if (id && clinicId) {
      await deleteWhere<Doctor>(STORAGE_KEYS.DOCTORS, (d) => d.id === id && d.clinicId === clinicId);
    }
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

