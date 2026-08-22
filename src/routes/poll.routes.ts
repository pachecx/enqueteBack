import { Router } from "express";
import {
  closePoll,
  deletePoll,
  postPoll,
  postVote,
  showAdmin,
  showPoll,
  showResults,
} from "../controllers/poll.controller.js";

export const pollRoutes = Router();
pollRoutes.post("/polls", postPoll);
pollRoutes.get("/polls/:slug", showPoll);
pollRoutes.post("/polls/:slug/vote", postVote);
pollRoutes.get("/polls/:slug/results", showResults);
pollRoutes.get("/admin/:token/poll", showAdmin);
pollRoutes.post("/admin/:token/close", closePoll);
pollRoutes.delete("/admin/:token/poll", deletePoll);
