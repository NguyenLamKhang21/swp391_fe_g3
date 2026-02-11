import { Link } from "react-router-dom";
import { useOrders } from "@/contexts/OrderContext";
import { currentUser, formatCurrency, ORDER_STATUS, STATUS_COLORS } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  ClipboardList,
  Package,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

const StaffDashboard = () => {
  const { orders, getOrderStats, getLowStockItems } = useOrders();
  const stats = getOrderStats();
  const lowStockItems = getLowStockItems(currentUser.storeId);

  // Đơn hàng gần đây (5 đơn)
  const recentOrders = orders.slice(0, 5);

  const statCards = [
    {
      title: "Tổng đơn hàng",
      value: stats.total,
      icon: ClipboardList,
      color: "bg-blue-500",
      lightBg: "bg-blue-50",
    },
    {
      title: "Chờ duyệt",
      value: stats.pending,
      icon: Clock,
      color: "bg-yellow-500",
      lightBg: "bg-yellow-50",
    },
    {
      title: "Đang xử lý",
      value: stats.inProcess,
      icon: TrendingUp,
      color: "bg-purple-500",
      lightBg: "bg-purple-50",
    },
    {
      title: "Đã giao",
      value: stats.delivered,
      icon: CheckCircle2,
      color: "bg-green-500",
      lightBg: "bg-green-50",
    },
    {
      title: "Từ chối",
      value: stats.rejected,
      icon: XCircle,
      color: "bg-red-500",
      lightBg: "bg-red-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tổng quan</h1>
          <p className="text-muted-foreground mt-1">
            Xin chào, {currentUser.name}! Đây là tình hình đơn hàng của bạn.
          </p>
        </div>
        <Link to="/staff/orders/create">
          <Button className="gap-2">
            <PlusCircle className="w-4 h-4" />
            Tạo đơn hàng mới
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <div
            key={card.title}
            className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg ${card.lightBg} flex items-center justify-center`}
              >
                <card.icon className={`w-5 h-5 ${card.color.replace("bg-", "text-")}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.title}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total amount card */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl border border-primary/20 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Tổng giá trị đơn hàng
            </p>
            <p className="text-3xl font-bold text-foreground mt-1">
              {formatCurrency(stats.totalAmount)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">Đơn hàng gần đây</h3>
            <Link
              to="/staff/orders"
              className="text-sm text-primary hover:text-primary/80 flex items-center gap-1"
            >
              Xem tất cả
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentOrders.map((order) => {
              const statusColor = STATUS_COLORS[order.status];
              return (
                <Link
                  key={order.id}
                  to={`/staff/orders/${order.id}`}
                  className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{order.id}</p>
                      <Badge
                        className={`${statusColor.bg} ${statusColor.text} border-0`}
                      >
                        {order.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {order.items.length} mặt hàng &bull;{" "}
                      {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <p className="font-medium text-foreground ml-4">
                    {formatCurrency(order.totalAmount)}
                  </p>
                </Link>
              );
            })}
            {recentOrders.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                Chưa có đơn hàng nào
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-card rounded-xl border border-border">
          <div className="flex items-center gap-2 p-4 border-b border-border">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <h3 className="font-semibold text-foreground">Nguyên liệu sắp hết</h3>
          </div>
          <div className="divide-y divide-border">
            {lowStockItems.map((item) => (
              <div key={item.ingredientId} className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-foreground text-sm">
                    {item.ingredientName}
                  </p>
                  {item.isEmpty ? (
                    <Badge className="bg-red-100 text-red-700 border-0 text-xs">
                      Hết hàng
                    </Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-700 border-0 text-xs">
                      Sắp hết
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-muted-foreground">
                    Tồn: {item.quantity} {item.unit}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Tối thiểu: {item.minLevel} {item.unit}
                  </p>
                </div>
                {/* Stock bar */}
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      item.isEmpty ? "bg-red-500" : "bg-yellow-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        (item.quantity / item.minLevel) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {lowStockItems.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Tồn kho ổn định
              </div>
            )}
          </div>
          <div className="p-4 border-t border-border">
            <Link to="/staff/orders/create">
              <Button variant="outline" size="sm" className="w-full gap-2">
                <PlusCircle className="w-4 h-4" />
                Đặt hàng bổ sung
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
