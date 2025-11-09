import { Router } from "express";
import { TableRepository } from "../tableRepository";
import type { User } from "../types";
import { safe } from "./utils";

const createUserId = () => `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export function createUsersRouter(repository: TableRepository<User>): Router {
  const router = Router();

  router.get(
    "/",
    safe(async (req, res) => {
    const email = req.query.email?.toString();
    const clinicId = req.query.clinicId?.toString();

    if (email) {
      const user = await repository.find((item) => item.email === email);
      res.json(user ?? null);
      return;
    }

    const users = await repository.list((user) =>
      clinicId ? user.clinicId === clinicId : true,
    );
    res.json(users);
    }),
  );

  router.post(
    "/",
    safe(async (req, res) => {
    const payload: User = {
      ...req.body,
      id: req.body.id || createUserId(),
      createdAt: req.body.createdAt || new Date().toISOString(),
    };
    await repository.upsert(payload);
    res.json(payload);
    }),
  );

  return router;
}

