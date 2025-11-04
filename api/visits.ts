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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const storage = getStorage();
  const clinicId = req.query.clinicId as string;

  if (req.method === 'GET') {
    let visits = storage.visits || [];
    if (clinicId) {
      visits = visits.filter((v: any) => v.clinicId === clinicId);
    }
    return res.status(200).json(visits);
  }

  if (req.method === 'POST') {
    const visit = {
      ...req.body,
      id: req.body.id || `visit_${Date.now()}_${Math.random()}`,
      createdAt: req.body.createdAt || new Date().toISOString(),
    };
    if (!storage.visits) storage.visits = [];
    const index = storage.visits.findIndex((v: any) => v.id === visit.id);
    if (index >= 0) {
      storage.visits[index] = visit;
    } else {
      storage.visits.push(visit);
    }
    return res.status(200).json(visit);
  }

  if (req.method === 'DELETE') {
    const id = req.query.id as string;
    if (id && clinicId) {
      storage.visits = (storage.visits || []).filter((v: any) => !(v.id === id && v.clinicId === clinicId));
    }
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

