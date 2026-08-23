import type { NextFunction, Request, Response } from "express";
import { getUserBySession } from "../services/auth.service.js";
import { AppError } from "../utils/errors.js";

export type AuthUser = {
  id: string;
  email: string | null;
  username: string | null;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const user = await getUserBySession(req.cookies?.authToken);
  if (!user) return next(new AppError("Faça login para continuar.", 401));
  req.user = user;
  return next();
}
