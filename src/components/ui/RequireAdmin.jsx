import { Navigate } from "react-router-dom";

const RequireAdmin = ({ children }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) {
    return <Navigate to={"/login"} replace />;
  }

  if (role !== "ADMIN") {
    return <Navigate to="/store" replace />;
  }

  return children;
};

export default RequireAdmin;
