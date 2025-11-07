import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Patient } from '../src/lib/store';
import { STORAGE_KEYS, deleteWhere, getCollection, upsertItem } from './_kvStore.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const clinicId = req.query.clinicId as string;

  if (req.method === 'GET') {
    let patients = await getCollection<Patient>(STORAGE_KEYS.PATIENTS);
    if (clinicId) {
      patients = patients.filter((p) => p.clinicId === clinicId);
    }
    return res.status(200).json(patients);
  }

  if (req.method === 'POST') {
    const now = new Date().toISOString();
    const patient: Patient = {
      ...req.body,
      id: req.body.id || `patient_${Date.now()}_${Math.random()}`,
      createdAt: req.body.createdAt || now,
      updatedAt: now,
    };

    await upsertItem<Patient>(STORAGE_KEYS.PATIENTS, patient);
    return res.status(200).json(patient);
  }

  if (req.method === 'DELETE') {
    const id = req.query.id as string;
    if (id && clinicId) {
      await deleteWhere<Patient>(STORAGE_KEYS.PATIENTS, (p) => p.id === id && p.clinicId === clinicId);
    }
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

