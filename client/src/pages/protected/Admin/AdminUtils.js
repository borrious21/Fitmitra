// ── src/pages/protected/Admin/adminUtils.js 

export const BASE = "/api/admin";

export function getToken() {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("jwt") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    ""
  );
}

export async function apiFetch(path, opts = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${body ? ": " + body : ""}`);
  }
  return res.json();
}

export function extractArray(raw, hint = null) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (hint && Array.isArray(raw[hint])) return raw[hint];
  const KEYS = ["data", "users", "result", "rows", "items", "list", "records", "results", "entries"];
  for (const k of KEYS) if (Array.isArray(raw[k])) return raw[k];
  if (raw.data && typeof raw.data === "object" && !Array.isArray(raw.data)) {
    if (hint && Array.isArray(raw.data[hint])) return raw.data[hint];
    for (const k of KEYS) if (Array.isArray(raw.data[k])) return raw.data[k];
  }
  return [];
}

export function extractObject(raw) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  if (raw.data && typeof raw.data === "object" && !Array.isArray(raw.data)) return raw.data;
  return raw;
}

export function pick(...vals) {
  for (const v of vals) if (v !== undefined && v !== null) return v;
  return undefined;
}