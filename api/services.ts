import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Service } from '../src/lib/store';
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
    let services = await getCollection<Service>(STORAGE_KEYS.SERVICES);
    if (clinicId) {
      services = services.filter((s) => s.clinicId === clinicId);
    }
    return res.status(200).json(services);
  }

  if (req.method === 'POST') {
    const service: Service = {
      ...req.body,
      id: req.body.id || `service_${Date.now()}_${Math.random()}`,
    };

    await upsertItem<Service>(STORAGE_KEYS.SERVICES, service);
    return res.status(200).json(service);
  }

  if (req.method === 'DELETE') {
    const id = req.query.id as string;
    if (id && clinicId) {
      await deleteWhere<Service>(STORAGE_KEYS.SERVICES, (s) => s.id === id && s.clinicId === clinicId);
    }
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

