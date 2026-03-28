// src/services/aiCoachService.js
const BASE_URL = "https://fitmitra-fyp.vercel.app";

const getToken = () =>
  localStorage.getItem("accessToken") ||
  localStorage.getItem("token") ||
  sessionStorage.getItem("accessToken") ||
  "";

const streamRequest = async (endpoint, body, onDelta, signal) => {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Server error ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder
      .decode(value)
      .split("\n")
      .filter((l) => l.startsWith("data:") && !l.includes("[DONE]"));
    for (const line of lines) {
      try {
        const json = JSON.parse(line.slice(5));
        if (json.delta) onDelta(json.delta);
      } catch { /* skip */ }
    }
  }
};

export const analyzeDay     = (data,     onDelta, signal) => streamRequest("/api/ai/analyze", data,       onDelta, signal);
export const chatWithCoach  = (messages, onDelta, signal) => streamRequest("/api/ai/chat",    { messages }, onDelta, signal);