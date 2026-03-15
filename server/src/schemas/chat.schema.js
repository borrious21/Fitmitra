// src/schemas/chat.schema.js  
import { z } from "zod";

export const sendMessageSchema = z.object({
  message:   z.string().trim().min(1).max(4000),
  sessionId: z.string().uuid(),
});

export const sessionIdParamSchema = z.object({
  sessionId: z.string().uuid(),
});

export const createSessionSchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
});

export const historyQuerySchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});