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
  const email = req.query.email as string;
  const clinicId = req.query.clinicId as string;

  if (req.method === 'GET') {
    if (email) {
      const user = (storage.users || []).find((u: any) => u.email === email);
      return res.status(200).json(user || null);
    } else if (clinicId) {
      const users = (storage.users || []).filter((u: any) => u.clinicId === clinicId);
      return res.status(200).json(users);
    } else {
      return res.status(200).json(storage.users || []);
    }
  }

  if (req.method === 'POST') {
    const user = { ...req.body, id: req.body.id || `user_${Date.now()}_${Math.random()}` };
    if (!storage.users) storage.users = [];
    const index = storage.users.findIndex((u: any) => u.id === user.id);
    if (index >= 0) {
      storage.users[index] = user;
    } else {
      storage.users.push(user);
    }
    return res.status(200).json(user);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

