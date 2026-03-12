// src/routes/chat.routes.js
import { Router } from "express";
import ChatController from "../controllers/chat.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";   

const router = Router();

router.use(authMiddleware);

router.post("/", ChatController.sendMessage);

router.get("/sessions", ChatController.getSessions);

router.post("/sessions", ChatController.createSession);

router.get("/sessions/:sessionId/history", ChatController.getHistory);

router.delete("/sessions/:sessionId", ChatController.deleteSession);

export default router;