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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const storage = getStorage();

  if (req.method === 'POST') {
    const { visitId, amount, date } = req.body;
    const visits = storage.visits || [];
    const visit = visits.find((v: any) => v.id === visitId);
    
    if (visit) {
      if (!visit.payments) visit.payments = [];
      const payment = {
        id: `payment_${Date.now()}_${Math.random()}`,
        visitId,
        amount,
        date: date || new Date().toISOString(),
      };
      visit.payments.push(payment);
      return res.status(200).json(payment);
    }
    
    return res.status(404).json({ error: 'Visit not found' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

