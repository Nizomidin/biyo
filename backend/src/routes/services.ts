import { Router } from "express";
import { TableRepository } from "../tableRepository";
import type { Service } from "../types";
import { safe } from "./utils";

const createServiceId = () => `service_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export function createServicesRouter(repository: TableRepository<Service>): Router {
  const router = Router();

  router.get(
    "/",
    safe(async (req, res) => {
    const clinicId = req.query.clinicId?.toString();
    const services = await repository.list((service) =>
      clinicId ? service.clinicId === clinicId : true,
    );
    res.json(services);
    }),
  );

  router.post(
    "/",
    safe(async (req, res) => {
    const payload: Service = {
      ...req.body,
      id: req.body.id || createServiceId(),
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

    await repository.deleteWhere((service) => service.id === id && service.clinicId === clinicId);
    res.json({ success: true });
    }),
  );

  return router;
}

