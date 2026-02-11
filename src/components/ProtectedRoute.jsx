import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * ProtectedRoute - Bảo vệ route theo authentication và role
 * @param {string[]} allowedRoles - Danh sách role được phép truy cập
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // User đăng nhập nhưng không có quyền → redirect về dashboard của họ
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
