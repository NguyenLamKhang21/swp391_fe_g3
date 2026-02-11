import { Link } from "react-router-dom";
import { useAuth, ROLE_DASHBOARDS } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ShieldX, ArrowLeft, Home } from "lucide-react";

const Unauthorized = () => {
  const { user, isAuthenticated } = useAuth();
  const dashboardPath = isAuthenticated
    ? ROLE_DASHBOARDS[user?.role] || "/"
    : "/login";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Không có quyền truy cập</h1>
        <p className="mt-3 text-muted-foreground">
          Tài khoản của bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là lỗi.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link to={dashboardPath}>
            <Button className="gap-2">
              <Home className="w-4 h-4" />
              Về Dashboard
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Trang chủ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
