import { getToken } from "../utils/secureStore";

const DEFAULT_BASE = "http://192.168.1.15:5000";
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

export async function estimatePackers(payload) {
  return request("/api/packers/estimate", { method: "POST", body: payload });
}

export async function createPackersBooking(payload) {
  return request("/api/packers", { method: "POST", body: payload });
}

export async function getPackersHistory() {
  return request("/api/packers/history", { method: "GET" });
}

export async function getPackersById(id) {
  return request(`/api/packers/${id}`, { method: "GET" });
}

export async function updatePackersStatus(id, status) {
  return request(`/api/packers/${id}/status`, { method: "PUT", body: { status } });
}


