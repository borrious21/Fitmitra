import { Router }        from "express";
import rateLimit         from "express-rate-limit";
import ChatController    from "../controllers/User/chat.controller.js";
import authMiddleware    from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

const chatLimiter = rateLimit({
  windowMs:    60_000,
  max:         20,
  keyGenerator: (req) => String(req.user.id), 
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: "Too many messages, please slow down." },
});

router.post("/",                              chatLimiter, ChatController.sendMessage);
router.get("/sessions",                                    ChatController.getSessions);
router.post("/sessions",                                   ChatController.createSession);
router.get("/sessions/:sessionId/history",                 ChatController.getHistory);
router.delete("/sessions/:sessionId",                      ChatController.deleteSession);

export default router;