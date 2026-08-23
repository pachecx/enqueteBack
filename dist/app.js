import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { pollRoutes } from "./routes/poll.routes.js";
import { authRoutes } from "./routes/auth.routes.js";
export const app = express();
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
    credentials: true,
}));
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
}));
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api", pollRoutes);
app.use("/api", authRoutes);
app.use((error, _req, res, _next) => res.status(500).json({ error: "Erro interno do servidor." }));
