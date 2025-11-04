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
    let services = storage.services || [];
    if (clinicId) {
      services = services.filter((s: any) => s.clinicId === clinicId);
    }
    return res.status(200).json(services);
  }

  if (req.method === 'POST') {
    const service = { ...req.body, id: req.body.id || `service_${Date.now()}_${Math.random()}` };
    if (!storage.services) storage.services = [];
    const index = storage.services.findIndex((s: any) => s.id === service.id);
    if (index >= 0) {
      storage.services[index] = service;
    } else {
      storage.services.push(service);
    }
    return res.status(200).json(service);
  }

  if (req.method === 'DELETE') {
    const id = req.query.id as string;
    if (id && clinicId) {
      storage.services = (storage.services || []).filter((s: any) => !(s.id === id && s.clinicId === clinicId));
    }
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

