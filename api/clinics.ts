import type { VercelRequest, VercelResponse } from '@vercel/node';

let storage: any = null;

function getStorage() {
  if (!storage) {
    if (typeof process !== 'undefined' && process.env.DATA_STORE) {
      try {
        storage = JSON.parse(process.env.DATA_STORE);
      } catch (e) {
        storage = { patients: [], doctors: [], services: [], visits: [], files: [], users: [], clinics: [] };
      }
    } else {
      storage = { patients: [], doctors: [], services: [], visits: [], files: [], users: [], clinics: [] };
    }
  }
  return storage;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const storage = getStorage();
  const id = req.query.id as string;

  if (req.method === 'GET') {
    if (id) {
      const clinic = (storage.clinics || []).find((c: any) => c.id === id);
      return res.status(200).json(clinic || null);
    } else {
      return res.status(200).json(storage.clinics || []);
    }
  }

  if (req.method === 'POST') {
    const clinic = { ...req.body, id: req.body.id || `clinic_${Date.now()}_${Math.random()}` };
    if (!storage.clinics) storage.clinics = [];
    const index = storage.clinics.findIndex((c: any) => c.id === clinic.id);
    if (index >= 0) {
      storage.clinics[index] = clinic;
    } else {
      storage.clinics.push(clinic);
    }
    return res.status(200).json(clinic);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

