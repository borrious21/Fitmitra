import pool                from "../../config/db.config.js";
import { getAIResponse }   from "../../services/gemini.service.js";
import SessionModel        from "../../models/session.model.js";
import MessageModel        from "../../models/message.model.js";
import {
  sendMessageSchema,
  sessionIdParamSchema,
  createSessionSchema,
  historyQuerySchema,
} from "../../schemas/chat.schema.js";

export default class ChatController {

  static async sendMessage(req, res) {
    const parsed = sendMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    }

    const { message, sessionId } = parsed.data;
    const userId = req.user.id;

    try {
      const session = await SessionModel.findOne(sessionId, userId);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const history = await MessageModel.getHistory(sessionId, 20);

      const aiReply = await getAIResponse(message, history);

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await MessageModel.insertPair(sessionId, message, aiReply, client);
        await SessionModel.touch(sessionId, client);
        await SessionModel.setTitleIfDefault(sessionId, message, client);
        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }

      return res.status(200).json({ reply: aiReply, sessionId });

    } catch (err) {
      console.error("[sendMessage]", err.message);
      return res.status(500).json({ error: "AI service failed" });
    }
  }

  // GET /chat/sessions
  static async getSessions(req, res) {
    try {
      const sessions = await SessionModel.findAllByUser(req.user.id);
      return res.status(200).json({ sessions });
    } catch (err) {
      console.error("[getSessions]", err.message);
      return res.status(500).json({ error: "Could not fetch sessions" });
    }
  }

  static async createSession(req, res) {
    const parsed = createSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    }

    try {
      const session = await SessionModel.create(req.user.id, parsed.data.title);
      return res.status(201).json({ session });
    } catch (err) {
      console.error("[createSession]", err.message);
      return res.status(500).json({ error: "Could not create session" });
    }
  }

  static async getHistory(req, res) {
    const paramParsed = sessionIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
      return res.status(400).json({ error: "Invalid sessionId" });
    }

    const queryParsed = historyQuerySchema.safeParse(req.query);
    if (!queryParsed.success) {
      return res.status(400).json({ error: queryParsed.error.flatten().fieldErrors });
    }

    const { sessionId }   = paramParsed.data;
    const { page, limit } = queryParsed.data;

    try {
      const session = await SessionModel.findOne(sessionId, req.user.id);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      const messages = await MessageModel.findBySession(sessionId, page, limit);
      return res.status(200).json({ session, messages, page, limit });

    } catch (err) {
      console.error("[getHistory]", err.message);
      return res.status(500).json({ error: "Could not fetch history" });
    }
  }

  static async deleteSession(req, res) {
    const parsed = sessionIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid sessionId" });
    }

    try {
      const deleted = await SessionModel.delete(parsed.data.sessionId, req.user.id);
      if (!deleted) {
        return res.status(404).json({ error: "Session not found" });
      }

      return res.status(200).json({ message: "Session deleted" });

    } catch (err) {
      console.error("[deleteSession]", err.message);
      return res.status(500).json({ error: "Could not delete session" });
    }
  }
}