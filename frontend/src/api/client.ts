import axios from "axios";
import { adminPath } from "../config";

const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000/api";

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("dsh_access");
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry && !isRefreshing) {
      original._retry = true;
      isRefreshing = true;
      const refresh = localStorage.getItem("dsh_refresh");
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh/`, { refresh });
          localStorage.setItem("dsh_access", data.access);
          isRefreshing = false;
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch (e) {
          isRefreshing = false;
          localStorage.removeItem("dsh_access");
          localStorage.removeItem("dsh_refresh");
          window.location.href = adminPath("/login");
        }
      }
    }
    isRefreshing = false;
    return Promise.reject(error);
  }
);

export default api;
