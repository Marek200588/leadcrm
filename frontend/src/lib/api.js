// Central API client. Handles auth tokens and transparent refresh on 401.

// In production, set VITE_API_URL to the backend's base URL (e.g.
// https://leadcrm-api.onrender.com). Locally it stays empty and Vite's
// dev proxy forwards /api to the backend.
const API_BASE = import.meta.env.VITE_API_URL || "";

const ACCESS_KEY = "leadcrm_access";
const REFRESH_KEY = "leadcrm_refresh";

export const tokenStore = {
  get access() {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  set(access, refresh) {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

class ApiError extends Error {
  constructor(status, detail) {
    super(detail || `Request failed (${status})`);
    this.status = status;
    this.detail = detail;
  }
}

async function tryRefresh() {
  const refresh = tokenStore.refresh;
  if (!refresh) return false;
  const res = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
  });
  if (!res.ok) {
    tokenStore.clear();
    return false;
  }
  const data = await res.json();
  tokenStore.set(data.access_token, data.refresh_token);
  return true;
}

async function request(path, { method = "GET", body, isForm = false, _retry = false } = {}) {
  const headers = {};
  const access = tokenStore.access;
  if (access) headers["Authorization"] = `Bearer ${access}`;

  let payload;
  if (isForm) {
    payload = new URLSearchParams(body).toString();
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  } else if (body !== undefined) {
    payload = JSON.stringify(body);
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}/api${path}`, { method, headers, body: payload });

  // Transparent token refresh, once.
  if (res.status === 401 && !_retry && tokenStore.refresh) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return request(path, { method, body, isForm, _retry: true });
    }
  }

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, data.detail);
  }
  return data;
}

export const api = {
  // Auth
  register: (email, full_name, password) =>
    request("/auth/register", { method: "POST", body: { email, full_name, password } }),
  login: async (email, password) => {
    const data = await request("/auth/login", {
      method: "POST",
      isForm: true,
      body: { username: email, password },
    });
    tokenStore.set(data.access_token, data.refresh_token);
    return data;
  },
  me: () => request("/auth/me"),
  logout: () => tokenStore.clear(),

  // Leads
  listLeads: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== "" && v != null)
    ).toString();
    return request(`/leads${qs ? `?${qs}` : ""}`);
  },
  getLead: (id) => request(`/leads/${id}`),
  createLead: (data) => request("/leads", { method: "POST", body: data }),
  updateLead: (id, data) => request(`/leads/${id}`, { method: "PATCH", body: data }),
  deleteLead: (id) => request(`/leads/${id}`, { method: "DELETE" }),
  addActivity: (id, data) =>
    request(`/leads/${id}/activities`, { method: "POST", body: data }),
  importLeads: (leads) => request("/leads/import", { method: "POST", body: { leads } }),

  // Dashboard
  dashboard: () => request("/dashboard"),
};

export { ApiError };
