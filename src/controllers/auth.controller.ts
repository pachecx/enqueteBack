import type { Request, Response } from "express";
import { z } from "zod";
import { login, logout, register } from "../services/auth.service.js";
import { claimPoll as claimPollService } from "../services/poll.service.js";
import { getPollsByOwner } from "../services/poll.service.js";
import { statusCodeFor } from "../utils/errors.js";

const credentialsSchema = z.object({
  identifier: z.string(),
  password: z.string(),
});

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 1000 * 60 * 60 * 24 * 30,
};

function respondWithSession(
  res: Response,
  session: { token: string; user: unknown },
) {
  res.cookie("authToken", session.token, cookieOptions);
  return res.status(200).json({ user: session.user });
}

export async function postRegister(req: Request, res: Response) {
  try {
    const { identifier, password } = credentialsSchema.parse(req.body);
    return respondWithSession(res, await register(identifier, password));
  } catch (error) {
    return res.status(statusCodeFor(error)).json({
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível criar a conta.",
    });
  }
}

export async function postLogin(req: Request, res: Response) {
  try {
    const { identifier, password } = credentialsSchema.parse(req.body);
    return respondWithSession(res, await login(identifier, password));
  }catch (error) {
  console.error("ERRO NO LOGIN:", error);

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.message,
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      error: "Dados inválidos.",
    });
  }

  return res.status(500).json({
    error: error instanceof Error
      ? error.message
      : "Erro interno do servidor.",
  });
}
}

export async function postLogout(req: Request, res: Response) {
  await logout(req.cookies?.authToken);
  res.clearCookie("authToken");
  return res.status(204).send();
}

export function getMe(req: Request, res: Response) {
  return res.json({ user: req.user });
}

export async function getMyPolls(req: Request, res: Response) {
  return res.json({ polls: await getPollsByOwner(req.user!.id) });
}

export async function claimPoll(req: Request, res: Response) {
  try {
    await claimPollService(String(req.body.adminToken), req.user!.id);
    return res.status(204).send();
  } catch (error) {
    return res.status(statusCodeFor(error)).json({
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível associar a enquete.",
    });
  }
}
