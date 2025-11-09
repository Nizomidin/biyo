import { Router } from "express";
import { TableRepository } from "../tableRepository";
import type { Payment, Visit } from "../types";
import { safe } from "./utils";

const createPaymentId = () => `payment_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export function createPaymentsRouter(visitsRepository: TableRepository<Visit>): Router {
  const router = Router();

  router.post(
    "/",
    safe(async (req, res) => {
    const { visitId, amount, method, date } = req.body;
    if (!visitId || typeof amount !== "number") {
      res.status(400).json({ error: "visitId and amount are required" });
      return;
    }

    const visit = await visitsRepository.find((item) => item.id === visitId);
    if (!visit) {
      res.status(404).json({ error: "Visit not found" });
      return;
    }

    const payment: Payment = {
      id: createPaymentId(),
      visitId,
      amount,
      date: date || new Date().toISOString(),
      method,
    };

    const payments = [...(visit.payments ?? []), payment];
    const cashAmount = payments
      .filter((p) => p.method === "cash")
      .reduce((sum, p) => sum + p.amount, 0);
    const ewalletAmount = payments
      .filter((p) => p.method === "ewallet")
      .reduce((sum, p) => sum + p.amount, 0);

    const updatedVisit: Visit = {
      ...visit,
      payments,
      cashAmount: Number.parseFloat(cashAmount.toFixed(2)),
      ewalletAmount: Number.parseFloat(ewalletAmount.toFixed(2)),
    };

    await visitsRepository.upsert(updatedVisit);
    res.json(payment);
    }),
  );

  return router;
}

