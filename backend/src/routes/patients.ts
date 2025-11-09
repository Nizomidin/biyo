import { Router } from "express";
import { TableRepository } from "../tableRepository";
import type { Patient } from "../types";
import { safe } from "./utils";

const createPatientId = () => `patient_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export function createPatientsRouter(repository: TableRepository<Patient>): Router {
  const router = Router();

  router.get(
    "/",
    safe(async (req, res) => {
    const clinicId = req.query.clinicId?.toString();
    const patients = await repository.list((patient) =>
      clinicId ? patient.clinicId === clinicId : true,
    );
    res.json(patients);
    }),
  );

  router.post(
    "/",
    safe(async (req, res) => {
    const now = new Date().toISOString();
    const payload: Patient = {
      ...req.body,
      id: req.body.id || createPatientId(),
      createdAt: req.body.createdAt || now,
      updatedAt: now,
    };

    await repository.upsert(payload);
    res.json(payload);
    }),
  );

  router.delete(
    "/",
    safe(async (req, res) => {
    const id = req.query.id?.toString();
    const clinicId = req.query.clinicId?.toString();
    if (!id || !clinicId) {
      res.status(400).json({ error: "Missing id or clinicId" });
      return;
    }

    await repository.deleteWhere((patient) => patient.id === id && patient.clinicId === clinicId);
    res.json({ success: true });
    }),
  );

  return router;
}

