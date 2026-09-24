import axios from 'axios';
import { API_BASE_URL, getToken, handleUnauthorized, isAuthError } from './session';

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});
API.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// A 401 means Laravel no longer accepts the stored token (expired, revoked by
// a logout in the customer portal, password reset, ...). Clear the cached
// session and go back to the customer login page rather than keeping a stale
// user/role on screen.
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isAuthError(error)) {
      handleUnauthorized();
    }

    return Promise.reject(error);
  }
);
export default API;
