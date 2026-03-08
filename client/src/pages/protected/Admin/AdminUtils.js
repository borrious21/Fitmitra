
const BASE_ADMIN = import.meta.env.VITE_API_URL ?? "/api/admin";
const BASE_API   = BASE_ADMIN.replace(/\/admin$/, ""); 

const NON_ADMIN_PREFIXES = ["/profile", "/auth", "/workouts", "/plans", "/progress"];

export async function apiFetch(path, options = {}) {
  const token    = localStorage.getItem("token") ?? localStorage.getItem("accessToken") ?? "";
  const isNonAdmin = NON_ADMIN_PREFIXES.some(p => path.startsWith(p));
  const base     = isNonAdmin ? BASE_API : BASE_ADMIN;

  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
    body: options.body != null && typeof options.body !== "string"
      ? JSON.stringify(options.body)
      : options.body,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg  = json?.message ?? json?.error ?? `HTTP ${res.status}`;
    const err  = new Error(msg);
    err.status = res.status;
    err.data   = json;
    throw err;
  }

  return json;
}

export function extractObject(json) {
  if (!json || typeof json !== "object") return {};
  if (json.data && typeof json.data === "object" && !Array.isArray(json.data)) return json.data;
  if (json.data && Array.isArray(json.data) && json.data.length === 1) return json.data[0];
  return json;
}

export function extractArray(json, key = null) {
  if (!json || typeof json !== "object") return [];
  if (key && json.data && typeof json.data === "object" && Array.isArray(json.data[key])) return json.data[key];
  if (Array.isArray(json.data)) return json.data;
  if (key && Array.isArray(json[key])) return json[key];
  if (json.data && typeof json.data === "object" && key && Array.isArray(json.data[key])) return json.data[key];
  const firstArr = Object.values(json).find(v => Array.isArray(v));
  return firstArr ?? [];
}

export function pick(...values) {
  for (const v of values) {
    if (v !== undefined && v !== null) return v;
  }
  return null;
}