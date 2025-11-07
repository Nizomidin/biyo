import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Payment, Visit } from '../src/lib/store';
import { STORAGE_KEYS, getCollection, setCollection } from './_kvStore';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const { visitId, amount, date } = req.body;
    const visits = await getCollection<Visit>(STORAGE_KEYS.VISITS);
    const visitIndex = visits.findIndex((v) => v.id === visitId);
    
    if (visitIndex >= 0) {
      const visit = visits[visitIndex];
      const payment: Payment = {
        id: `payment_${Date.now()}_${Math.random()}`,
        visitId,
        amount,
        date: date || new Date().toISOString(),
      };

      const payments = visit.payments ? [...visit.payments, payment] : [payment];
      visits[visitIndex] = { ...visit, payments };

      await setCollection<Visit>(STORAGE_KEYS.VISITS, visits);
      return res.status(200).json(payment);
    }
    
    return res.status(404).json({ error: 'Visit not found' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

