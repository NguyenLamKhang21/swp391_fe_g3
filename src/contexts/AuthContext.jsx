import { createContext, useContext, useState, useCallback } from "react";

// Roles trong hệ thống
export const ROLES = {
  FRANCHISE_STAFF: "franchise_staff",
  SUPPLY_COORDINATOR: "supply_coordinator",
  CENTRAL_KITCHEN: "central_kitchen",
  MANAGER: "manager",
};

export const ROLE_LABELS = {
  [ROLES.FRANCHISE_STAFF]: "Nhân viên Cửa hàng",
  [ROLES.SUPPLY_COORDINATOR]: "Điều phối Cung ứng",
  [ROLES.CENTRAL_KITCHEN]: "Nhân viên Bếp Trung Tâm",
  [ROLES.MANAGER]: "Quản lý",
};

export const ROLE_DASHBOARDS = {
  [ROLES.FRANCHISE_STAFF]: "/staff/dashboard",
  [ROLES.SUPPLY_COORDINATOR]: "/coordinator/dashboard",
  [ROLES.CENTRAL_KITCHEN]: "/kitchen/dashboard",
  [ROLES.MANAGER]: "/manager/dashboard",
};

// Mock users - mỗi account đại diện cho 1 role
export const mockUsers = [
  {
    id: "USR001",
    name: "Nguyễn Văn A",
    email: "staff@centralkitchen.vn",
    password: "123456",
    role: ROLES.FRANCHISE_STAFF,
    storeId: "STORE001",
    storeName: "CentralKitchen - Chi nhánh Quận 1",
    avatar: null,
  },
  {
    id: "USR002",
    name: "Trần Thị B",
    email: "coordinator@centralkitchen.vn",
    password: "123456",
    role: ROLES.SUPPLY_COORDINATOR,
    storeId: null,
    storeName: null,
    avatar: null,
  },
  {
    id: "USR003",
    name: "Lê Văn C",
    email: "kitchen@centralkitchen.vn",
    password: "123456",
    role: ROLES.CENTRAL_KITCHEN,
    storeId: null,
    storeName: "Bếp Trung Tâm",
    avatar: null,
  },
  {
    id: "USR004",
    name: "Phạm Thị D",
    email: "manager@centralkitchen.vn",
    password: "123456",
    role: ROLES.MANAGER,
    storeId: null,
    storeName: null,
    avatar: null,
  },
];

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Khôi phục session từ localStorage
    const saved = localStorage.getItem("ck_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const login = useCallback((email, password) => {
    const found = mockUsers.find(
      (u) => u.email === email && u.password === password
    );
    if (!found) {
      return { success: false, error: "Email hoặc mật khẩu không đúng" };
    }
    // Lưu user (bỏ password)
    const { password: _, ...safeUser } = found;
    setUser(safeUser);
    localStorage.setItem("ck_user", JSON.stringify(safeUser));
    return { success: true, user: safeUser };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("ck_user");
  }, []);

  const isAuthenticated = !!user;

  const getDashboardPath = useCallback(() => {
    if (!user) return "/login";
    return ROLE_DASHBOARDS[user.role] || "/login";
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated,
        getDashboardPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
