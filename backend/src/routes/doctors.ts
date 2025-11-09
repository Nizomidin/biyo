import { Router } from "express";
import { TableRepository } from "../tableRepository";
import type { Doctor } from "../types";
import { safe } from "./utils";

const createDoctorId = () => `doctor_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export function createDoctorsRouter(repository: TableRepository<Doctor>): Router {
  const router = Router();

  router.get(
    "/",
    safe(async (req, res) => {
    const clinicId = req.query.clinicId?.toString();
    const doctors = await repository.list((doctor) =>
      clinicId ? doctor.clinicId === clinicId : true,
    );
    res.json(doctors);
    }),
  );

  router.post(
    "/",
    safe(async (req, res) => {
    const payload: Doctor = {
      ...req.body,
      id: req.body.id || createDoctorId(),
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

    await repository.deleteWhere((doctor) => doctor.id === id && doctor.clinicId === clinicId);
    res.json({ success: true });
    }),
  );

  return router;
}

