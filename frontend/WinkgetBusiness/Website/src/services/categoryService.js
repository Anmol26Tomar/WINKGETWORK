import { API_BASE_URL, endpoints } from "../apiConfig";

function authHeaders() {
  const token = localStorage.getItem("wb_token");
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

const base = `${API_BASE_URL}${
  endpoints.business.categories || "/api/business/categories"
}`;

export async function listCategories() {
  const res = await fetch(base, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch");
  return data.categories || [];
}

export async function createCategory(payload) {
  const res = await fetch(base, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create");
  return data;
}

export async function updateCategory(id, payload) {
  const res = await fetch(`${base}/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update");
  return data;
}

export async function deleteCategory(id) {
  const res = await fetch(`${base}/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete");
  return data;
}

export async function addSubcategory(categoryId, payload) {
  const res = await fetch(`${base}/${categoryId}/subcategories`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to add subcategory");
  return data;
}

export async function updateSubcategory(categoryId, subId, payload) {
  const res = await fetch(`${base}/${categoryId}/subcategories/${subId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update subcategory");
  return data;
}

export async function deleteSubcategory(categoryId, subId) {
  const res = await fetch(`${base}/${categoryId}/subcategories/${subId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete subcategory");
  return data;
}

export async function addSecondary(categoryId, subId, payload) {
  const res = await fetch(
    `${base}/${categoryId}/subcategories/${subId}/secondary`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to add secondary");
  return data;
}

export async function updateSecondary(categoryId, subId, secId, payload) {
  const res = await fetch(
    `${base}/${categoryId}/subcategories/${subId}/secondary/${secId}`,
    {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(payload),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update secondary");
  return data;
}

export async function deleteSecondary(categoryId, subId, secId) {
  const res = await fetch(
    `${base}/${categoryId}/subcategories/${subId}/secondary/${secId}`,
    {
      method: "DELETE",
      headers: authHeaders(),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete secondary");
  return data;
}

// Recursive node endpoints (supports up to 5 levels)
export async function addNode(categoryId, parentPath, name, legacyRef) {
  const res = await fetch(`${base}/${categoryId}/nodes/add`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ parentPath, name, legacyRef }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to add node");
  return data;
}

export async function updateNode(categoryId, path, name) {
  const res = await fetch(`${base}/${categoryId}/nodes/update`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ path, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update node");
  return data;
}

export async function deleteNode(categoryId, path) {
  const res = await fetch(`${base}/${categoryId}/nodes/delete`, {
    method: "DELETE",
    headers: authHeaders(),
    body: JSON.stringify({ path }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete node");
  return data;
}
