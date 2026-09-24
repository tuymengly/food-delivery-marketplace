import axios from 'axios';
import { getToken, handleUnauthorized, isPublicAuthRequest } from './app';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Anything Laravel answers 401 to means the stored token is no longer valid
// (expired, revoked by a logout in the admin portal, password reset, ...).
// Drop the cached session and go back to login instead of leaving the UI
// half-authenticated with a stale user/role.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || '';

    if (status === 401 && !isPublicAuthRequest(url)) {
      handleUnauthorized();
    }

    return Promise.reject(error);
  }
);

export default api;
