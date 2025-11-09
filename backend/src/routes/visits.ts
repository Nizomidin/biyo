import { Router } from "express";
import { TableRepository } from "../tableRepository";
import type { Visit } from "../types";
import { safe } from "./utils";

const createVisitId = () => `visit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export function createVisitsRouter(repository: TableRepository<Visit>): Router {
  const router = Router();

  router.get(
    "/",
    safe(async (req, res) => {
    const clinicId = req.query.clinicId?.toString();
    const visits = await repository.list((visit) =>
      clinicId ? visit.clinicId === clinicId : true,
    );
    res.json(visits);
    }),
  );

  router.post(
    "/",
    safe(async (req, res) => {
    const payload: Visit = {
      ...req.body,
      id: req.body.id || createVisitId(),
      createdAt: req.body.createdAt || new Date().toISOString(),
      payments: req.body.payments ?? [],
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

    await repository.deleteWhere((visit) => visit.id === id && visit.clinicId === clinicId);
    res.json({ success: true });
    }),
  );

  return router;
}

