import type { VercelRequest, VercelResponse } from '@vercel/node';

// Simple in-memory storage (in production, use Supabase or another database)
let storage: any = null;

// Initialize storage from environment or use in-memory
function getStorage() {
  if (!storage) {
    // Try to get from environment (could be JSON string)
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
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const storage = getStorage();
  const clinicId = req.query.clinicId as string;

  if (req.method === 'GET') {
    let patients = storage.patients || [];
    if (clinicId) {
      patients = patients.filter((p: any) => p.clinicId === clinicId);
    }
    return res.status(200).json(patients);
  }

  if (req.method === 'POST') {
    const patient = {
      ...req.body,
      id: req.body.id || `patient_${Date.now()}_${Math.random()}`,
      updatedAt: new Date().toISOString(),
    };
    
    if (!storage.patients) storage.patients = [];
    const index = storage.patients.findIndex((p: any) => p.id === patient.id);
    
    if (index >= 0) {
      storage.patients[index] = patient;
    } else {
      patient.createdAt = new Date().toISOString();
      storage.patients.push(patient);
    }
    
    return res.status(200).json(patient);
  }

  if (req.method === 'DELETE') {
    const id = req.query.id as string;
    if (id && clinicId) {
      storage.patients = (storage.patients || []).filter(
        (p: any) => !(p.id === id && p.clinicId === clinicId)
      );
    }
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

