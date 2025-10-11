import { getToken } from "../utils/secureStore";

const DEFAULT_BASE = "http://172.20.49.88:3001";
const API_BASE = process.env.EXPO_PUBLIC_API_BASE || DEFAULT_BASE;

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = await getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export async function estimateTransport(payload) {
  return request("/api/transport/estimate", { method: "POST", body: payload });
}

export async function createTransport(payload) {
  return request("/api/transport/create", { method: "POST", body: payload });
}

export async function listTransportByUser(userId) {
  return request(`/api/transport/user/${userId}`, { method: "GET" });
}

export async function getTransportById(id) {
  return request(`/api/transport/${id}`, { method: "GET" });
}

export async function updateTransportStatus(id, status, captainRef) {
  return request(`/api/transport/${id}/status`, {
    method: "PUT",
    body: { status, captainRef },
  });
}

export async function cancelTransport(id) {
  return request(`/api/transport/${id}`, { method: "DELETE" });
}
