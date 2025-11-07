import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { User } from '../src/lib/store';
import { STORAGE_KEYS, findItem, getCollection, upsertItem } from './_kvStore';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const email = req.query.email as string;
  const clinicId = req.query.clinicId as string;

  if (req.method === 'GET') {
    if (email) {
      const user = await findItem<User>(STORAGE_KEYS.USERS, (u) => u.email === email);
      return res.status(200).json(user || null);
    }

    const users = await getCollection<User>(STORAGE_KEYS.USERS);
    if (clinicId) {
      return res.status(200).json(users.filter((u) => u.clinicId === clinicId));
    }
    return res.status(200).json(users);
  }

  if (req.method === 'POST') {
    const user: User = {
      ...req.body,
      id: req.body.id || `user_${Date.now()}_${Math.random()}`,
      createdAt: req.body.createdAt || new Date().toISOString(),
    };

    await upsertItem<User>(STORAGE_KEYS.USERS, user);
    return res.status(200).json(user);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

