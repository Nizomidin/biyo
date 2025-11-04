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
    let doctors = storage.doctors || [];
    if (clinicId) {
      doctors = doctors.filter((d: any) => d.clinicId === clinicId);
    }
    return res.status(200).json(doctors);
  }

  if (req.method === 'POST') {
    const doctor = { ...req.body, id: req.body.id || `doctor_${Date.now()}_${Math.random()}` };
    if (!storage.doctors) storage.doctors = [];
    const index = storage.doctors.findIndex((d: any) => d.id === doctor.id);
    if (index >= 0) {
      storage.doctors[index] = doctor;
    } else {
      storage.doctors.push(doctor);
    }
    return res.status(200).json(doctor);
  }

  if (req.method === 'DELETE') {
    const id = req.query.id as string;
    if (id && clinicId) {
      storage.doctors = (storage.doctors || []).filter((d: any) => !(d.id === id && d.clinicId === clinicId));
    }
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

