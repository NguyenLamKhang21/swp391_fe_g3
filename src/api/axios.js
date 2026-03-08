import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080/api",
});

// Automatically attach the Bearer token (if present) to every request
API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Token-refresh interceptor ────────────────────────────────────────────────
// When any request comes back with a 401 (access token expired), this
// interceptor will:
//   1. Call POST /auth/refresh with the stored refreshToken
//   2. Save the new access token (and optionally new refreshToken) to localStorage
//   3. Retry the original failed request with the new token automatically
// If the refresh itself fails (refresh token also expired) → clear storage and
// redirect to /login so the user can re-authenticate.

let isRefreshing = false;           // prevent multiple simultaneous refresh calls
let failedQueue = [];               // queue requests while a refresh is in progress

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

API.interceptors.response.use(
  (response) => response, // pass through all successful responses unchanged

  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401 and only once per request (_retry flag)
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = sessionStorage.getItem("refreshToken");

      // No refresh token → force re-login immediately
      if (!refreshToken) {
        clearAuthStorage();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      // If a refresh is already in flight, queue this request until it resolves
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return API(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // ── Call the backend refresh endpoint ──────────────────────────────
        // Backend expects the refresh token as a "Refresh-Token" request header
        const res = await axios.post(
          "http://localhost:8080/api/auth/refresh",
          { headers: { "Refresh-Token": refreshToken } }
        );

        // Response shape: { statusCode, message, data: { token, refreshToken, ... } }
        const newToken        = res.data.data.token;
        const newRefreshToken = res.data.data.refreshToken;

        sessionStorage.setItem("token", newToken);
        if (newRefreshToken) {
          sessionStorage.setItem("refreshToken", newRefreshToken);
        }

        processQueue(null, newToken);

        // Retry the original request with the refreshed token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return API(originalRequest);
      } catch (refreshError) {
        // Refresh token is also expired / invalid → logout
        processQueue(refreshError, null);
        clearAuthStorage();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/** Remove all auth-related items from localStorage. */
const clearAuthStorage = () => {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("refreshToken");
  sessionStorage.removeItem("role");
  sessionStorage.removeItem("email");
  sessionStorage.removeItem("userId");
  sessionStorage.removeItem("franchiseStoreInfo");
};

export default API;
