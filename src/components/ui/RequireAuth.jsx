import { Navigate } from "react-router-dom";

/**
 * Generic auth guard.
 *
 * Props:
 *  - roles: string[]  — list of allowed roles, e.g. ["ADMIN", "STAFF"]
 *                       If omitted / empty, ANY logged-in user is allowed.
 *  - redirectTo: string — where to send unauthorised users (default: "/login")
 *
 * How the session lifetime works:
 *  - The short-lived ACCESS TOKEN is refreshed automatically by the axios
 *    interceptor in axios.js whenever a 401 is returned — no action needed here.
 *  - This guard checks the REFRESH TOKEN expiry instead, because that is the
 *    true end of the user's session (7-day lifetime in the backend).
 *  - As long as the refresh token is still valid the user stays logged in,
 *    even if the access token has already expired.
 *
 * Usage in App.jsx:
 *   <RequireAuth roles={["ADMIN"]}>
 *     <MainLayout ... />
 *   </RequireAuth>
 */

/** Decode a JWT and return its exp claim in milliseconds (or 0 on failure). */
const getTokenExpiry = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp ? payload.exp * 1000 : 0;
  } catch {
    return 0; // treat malformed token as already expired
  }
};

/** Clear every auth-related key from sessionStorage. */
const clearAuthStorage = () => {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("refreshToken");
  sessionStorage.removeItem("role");
  sessionStorage.removeItem("email");
  sessionStorage.removeItem("userId");
  sessionStorage.removeItem("franchiseStoreInfo");
};

const RequireAuth = ({ children, roles = [], redirectTo = "/login" }) => {
  const refreshToken = sessionStorage.getItem("refreshToken");
  const role         = sessionStorage.getItem("role");

  // 1. No refresh token at all → user has never logged in (or was logged out)
  if (!refreshToken) {
    return <Navigate to="/login" replace />;
  }

  // 2. Refresh token itself is expired → the full session is over, force re-login
  if (getTokenExpiry(refreshToken) < Date.now()) {
    clearAuthStorage();
    return <Navigate to="/login" replace />;
  }

  // 3. Role restriction: redirect unauthorised roles
  //    (the access token may be momentarily expired here, but the axios
  //     interceptor will silently refresh it on the first API call)
  if (roles.length > 0 && !roles.includes(role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default RequireAuth;
