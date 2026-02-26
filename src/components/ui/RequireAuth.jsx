import { Navigate } from "react-router-dom";

/**
 * Generic auth guard.
 *
 * Props:
 *  - roles: string[]  — list of allowed roles, e.g. ["ADMIN", "STAFF"]
 *                       If omitted / empty, ANY logged-in user is allowed.
 *  - redirectTo: string — where to send unauthorised users (default: "/store")
 *
 * Usage in App.jsx:
 *   <RequireAuth roles={["ADMIN"]}>
 *     <MainLayout ... />
 *   </RequireAuth>
 */
const RequireAuth = ({ children, roles = [], redirectTo = "/store" }) => {
  const token = localStorage.getItem("token");
  const role  = localStorage.getItem("role");

  // 1. Not logged in → go to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. Role restriction provided and current role isn't allowed → redirect
  if (roles.length > 0 && !roles.includes(role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

export default RequireAuth;
