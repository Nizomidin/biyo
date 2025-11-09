import { Router } from "express";
import { TableRepository } from "../tableRepository";
import type { Clinic } from "../types";
import { safe } from "./utils";

const createClinicId = () => `clinic_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export function createClinicsRouter(repository: TableRepository<Clinic>): Router {
  const router = Router();

  router.get(
    "/",
    safe(async (req, res) => {
    const id = req.query.id?.toString();
    if (id) {
      const clinic = await repository.find((item) => item.id === id);
      res.json(clinic ?? null);
      return;
    }

    const clinics = await repository.list();
    res.json(clinics);
    }),
  );

  router.post(
    "/",
    safe(async (req, res) => {
    const payload: Clinic = {
      ...req.body,
      id: req.body.id || createClinicId(),
      createdAt: req.body.createdAt || new Date().toISOString(),
    };
    await repository.upsert(payload);
    res.json(payload);
    }),
  );

  return router;
}

