import type { NextFunction, Request, Response } from "express";

export const safe =
  (
    handler: (req: Request, res: Response, next: NextFunction) => Promise<void> | void,
  ) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };

