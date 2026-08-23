import { Router } from "express";
import {
  getMe,
  postLogin,
  postLogout,
  postRegister,
  claimPoll,
  getMyPolls,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const authRoutes = Router();
authRoutes.post("/auth/register", postRegister);
authRoutes.post("/auth/login", postLogin);
authRoutes.post("/auth/logout", postLogout);
authRoutes.get("/auth/me", requireAuth, getMe);
authRoutes.get("/auth/polls", requireAuth, getMyPolls);
authRoutes.post("/auth/claim-poll", requireAuth, claimPoll);
