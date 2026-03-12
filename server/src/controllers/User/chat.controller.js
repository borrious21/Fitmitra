// src/controllers/chat.controller.js
import ChatService from "../../services/chat.service.js";

class ChatController {
  /**
   * POST /api/chat
   * Body: { message: string, session_id?: string }
   * Sends a message and returns the AI reply.
   */
  static async sendMessage(req, res, next) {
    try {
      const { message, session_id } = req.body;

      if (!message || typeof message !== "string" || !message.trim()) {
        return res.status(400).json({
          success: false,
          message: "message is required and must be a non-empty string",
          code: "VALIDATION_ERROR",
        });
      }

      if (message.trim().length > 2000) {
        return res.status(400).json({
          success: false,
          message: "Message too long. Please keep it under 2000 characters.",
          code: "MESSAGE_TOO_LONG",
        });
      }

      const result = await ChatService.chat(req.user.id, message.trim(), session_id ?? null);

      return res.status(200).json({
        success: true,
        data: {
          reply: result.message,
          session_id: result.session_id,
          usage: {
            input_tokens: result.input_tokens,
            output_tokens: result.output_tokens,
          },
        },
      });
    } catch (error) {
      // Surface Anthropic API errors clearly
      if (error?.status === 401) {
        return res.status(500).json({
          success: false,
          message: "AI service authentication failed. Please contact support.",
          code: "AI_AUTH_ERROR",
        });
      }
      if (error?.status === 429) {
        return res.status(429).json({
          success: false,
          message: "AI service is busy. Please try again in a moment.",
          code: "AI_RATE_LIMIT",
        });
      }
      next(error);
    }
  }

  /**
   * GET /api/chat/sessions
   * Returns a list of the user's chat sessions.
   */
  static async getSessions(req, res, next) {
    try {
      const sessions = await ChatService.getUserSessions(req.user.id, 20);
      return res.status(200).json({
        success: true,
        count: sessions.length,
        data: sessions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/chat/sessions/:sessionId/history
   * Returns message history for a specific session.
   */
  static async getHistory(req, res, next) {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: "sessionId is required",
          code: "VALIDATION_ERROR",
        });
      }

      const history = await ChatService.getChatHistory(req.user.id, sessionId);

      return res.status(200).json({
        success: true,
        session_id: sessionId,
        count: history.length,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/chat/sessions
   * Creates a new blank chat session.
   */
  static async createSession(req, res, next) {
    try {
      const sessionId = await ChatService.createSession(req.user.id);
      return res.status(201).json({
        success: true,
        message: "Chat session created",
        data: { session_id: sessionId },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/chat/sessions/:sessionId
   * Deletes a session and all its messages.
   */
  static async deleteSession(req, res, next) {
    try {
      const { sessionId } = req.params;
      const deleted = await ChatService.deleteSession(req.user.id, sessionId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Session not found",
          code: "SESSION_NOT_FOUND",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Chat session deleted",
      });
    } catch (error) {
      next(error);
    }
  }
}

export default ChatController;