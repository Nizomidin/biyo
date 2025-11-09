import { Router } from "express";
import { TableRepository } from "../tableRepository";
import type { PatientFile } from "../types";
import { safe } from "./utils";

const createFileId = () => `file_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export function createFilesRouter(repository: TableRepository<PatientFile>): Router {
  const router = Router();

  router.get(
    "/",
    safe(async (req, res) => {
    const patientId = req.query.patientId?.toString();
    const clinicId = req.query.clinicId?.toString();

    const files = await repository.list((file) => {
      if (patientId && file.patientId !== patientId) {
        return false;
      }
      if (clinicId && file.clinicId !== clinicId) {
        return false;
      }
      return true;
    });

    res.json(files);
    }),
  );

  router.post(
    "/",
    safe(async (req, res) => {
    const payload: PatientFile = {
      ...req.body,
      id: req.body.id || createFileId(),
      uploadedAt: req.body.uploadedAt || new Date().toISOString(),
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

    await repository.deleteWhere((file) => file.id === id && file.clinicId === clinicId);
    res.json({ success: true });
    }),
  );

  return router;
}

