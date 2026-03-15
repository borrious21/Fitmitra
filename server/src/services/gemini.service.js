import { GoogleGenerativeAI } from "@google/generative-ai";
import { geminiApiKey } from "../config/env.config.js";  

const genAI = new GoogleGenerativeAI(geminiApiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction: `You are FitBot, an expert fitness and nutrition assistant.
    Give practical, evidence-based advice on workouts, nutrition, recovery, and goals.
    Be concise (under 150 words), encouraging, and friendly.`,
});

function toGeminiHistory(pgRows = []) {
  return pgRows.map(({ role, content }) => ({
    role: role === "assistant" ? "model" : "user",
    parts: [{ text: content }],
  }));
}

export async function getAIResponse(userMessage, pgHistory = []) {
  const chat = model.startChat({
    history: toGeminiHistory(pgHistory),
  });

  const result = await chat.sendMessage(userMessage);
  return result.response.text();
}