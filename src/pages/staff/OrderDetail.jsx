import { useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useOrders } from "@/contexts/OrderContext";
import {
  ORDER_STATUS,
  STATUS_COLORS,
  PRIORITY_COLORS,
  formatCurrency,
  formatDateTime,
  formatDate,
} from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Package,
  Truck,
  User,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Snowflake,
  MessageSquare,
  Ban,
  ChefHat,
  CircleDot,
  ArrowRight,
} from "lucide-react";

// Icon cho từng status trong timeline
const statusIcons = {
  [ORDER_STATUS.PENDING]: Clock,
  [ORDER_STATUS.APPROVED]: CheckCircle2,
  [ORDER_STATUS.REJECTED]: XCircle,
  [ORDER_STATUS.IN_PROCESS]: ChefHat,
  [ORDER_STATUS.COOKING_DONE]: CheckCircle2,
  [ORDER_STATUS.DELIVERING]: Truck,
  [ORDER_STATUS.DELIVERED]: CheckCircle2,
  [ORDER_STATUS.CANCELLED]: Ban,
};

const statusIconColors = {
  [ORDER_STATUS.PENDING]: "text-yellow-500 bg-yellow-50",
  [ORDER_STATUS.APPROVED]: "text-blue-500 bg-blue-50",
  [ORDER_STATUS.REJECTED]: "text-red-500 bg-red-50",
  [ORDER_STATUS.IN_PROCESS]: "text-purple-500 bg-purple-50",
  [ORDER_STATUS.COOKING_DONE]: "text-green-500 bg-green-50",
  [ORDER_STATUS.DELIVERING]: "text-indigo-500 bg-indigo-50",
  [ORDER_STATUS.DELIVERED]: "text-emerald-500 bg-emerald-50",
  [ORDER_STATUS.CANCELLED]: "text-gray-500 bg-gray-50",
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getOrderById, cancelOrder } = useOrders();

  const order = useMemo(() => getOrderById(id), [id, getOrderById]);

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FileText className="w-16 h-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold text-foreground">
          Không tìm thấy đơn hàng
        </h2>
        <p className="text-muted-foreground mt-2">
          Đơn hàng <span className="font-mono">{id}</span> không tồn tại.
        </p>
        <Link to="/staff/orders" className="mt-4">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách
          </Button>
        </Link>
      </div>
    );
  }

  const statusColor = STATUS_COLORS[order.status];
  const priorityColor = PRIORITY_COLORS[order.priority];
  const canCancel = order.status === ORDER_STATUS.PENDING;

  const handleCancel = () => {
    if (window.confirm("Bạn có chắc muốn hủy đơn hàng này?")) {
      cancelOrder(order.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{order.id}</h1>
              <Badge
                className={`${statusColor.bg} ${statusColor.text} border-0`}
              >
                {order.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-0.5">
              Tạo lúc {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-12 sm:ml-0">
          {canCancel && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCancel}
              className="gap-1"
            >
              <Ban className="w-4 h-4" />
              Hủy đơn
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Order Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Rejection Alert */}
          {order.status === ORDER_STATUS.REJECTED && order.rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-800">
                    Đơn hàng bị từ chối
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    {order.rejectionReason}
                  </p>
                  {order.rejectedBy && (
                    <p className="text-xs text-red-600 mt-2">
                      Từ chối bởi: {order.rejectedBy}
                    </p>
                  )}
                  <Link to="/staff/orders/create" className="inline-block mt-3">
                    <Button size="sm" className="gap-1">
                      <ArrowRight className="w-3 h-3" />
                      Tạo đơn hàng mới
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Order Items */}
          <div className="bg-card rounded-xl border border-border">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Package className="w-4 h-4" />
                Chi tiết nguyên liệu
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">
                      STT
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">
                      Nguyên liệu
                    </th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">
                      Số lượng
                    </th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">
                      Đơn giá
                    </th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">
                      Thành tiền
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {order.items.map((item, index) => (
                    <tr key={item.ingredientId} className="hover:bg-accent/20">
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">
                          {item.ingredientName}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                        {formatCurrency(item.pricePerUnit)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-foreground">
                        {formatCurrency(item.quantity * item.pricePerUnit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-accent/30">
                    <td
                      colSpan={4}
                      className="px-4 py-3 text-right font-semibold text-foreground"
                    >
                      Tổng cộng
                    </td>
                    <td className="px-4 py-3 text-right text-lg font-bold text-primary">
                      {formatCurrency(order.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="bg-card rounded-xl border border-border">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Lịch sử trạng thái
              </h3>
            </div>
            <div className="p-4">
              <div className="space-y-0">
                {order.statusHistory.map((entry, index) => {
                  const Icon = statusIcons[entry.status] || CircleDot;
                  const iconColor =
                    statusIconColors[entry.status] || "text-gray-500 bg-gray-50";
                  const isLast = index === order.statusHistory.length - 1;

                  return (
                    <div key={index} className="flex gap-4">
                      {/* Timeline line */}
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${iconColor}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        {!isLast && (
                          <div className="w-0.5 h-full min-h-8 bg-border my-1" />
                        )}
                      </div>

                      {/* Content */}
                      <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">
                            {entry.status}
                          </p>
                          {isLast && (
                            <Badge className="bg-primary/10 text-primary border-0 text-xs">
                              Hiện tại
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {entry.note}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(entry.timestamp)}
                          </span>
                          {entry.by && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {entry.by}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="space-y-4">
          {/* Order Info Card */}
          <div className="bg-card rounded-xl border border-border p-4 space-y-4">
            <h3 className="font-semibold text-foreground">Thông tin đơn hàng</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <CircleDot className="w-4 h-4" />
                  Trạng thái
                </span>
                <Badge
                  className={`${statusColor.bg} ${statusColor.text} border-0`}
                >
                  {order.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Ưu tiên
                </span>
                <Badge
                  className={`${priorityColor?.bg} ${priorityColor?.text} border-0`}
                >
                  {order.priority}
                </Badge>
              </div>

              <div className="h-px bg-border" />

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Người tạo
                </span>
                <span className="text-sm font-medium text-foreground">
                  {order.createdBy}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Ngày tạo
                </span>
                <span className="text-sm text-foreground">
                  {formatDate(order.createdAt)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  Ngày giao
                </span>
                <span className="text-sm font-medium text-foreground">
                  {formatDate(order.deliveryDate)}
                </span>
              </div>

              <div className="h-px bg-border" />

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Số mặt hàng
                </span>
                <span className="text-sm font-medium text-foreground">
                  {order.items.length}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tổng giá trị</span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Info Card */}
          <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <h3 className="font-semibold text-foreground">Thông tin giao hàng</h3>

            {order.storageInstructions && (
              <div className="flex items-start gap-2">
                <Snowflake className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Bảo quản</p>
                  <p className="text-sm text-foreground">
                    {order.storageInstructions}
                  </p>
                </div>
              </div>
            )}

            {order.deliveryNotes && (
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Ghi chú</p>
                  <p className="text-sm text-foreground">{order.deliveryNotes}</p>
                </div>
              </div>
            )}

            {!order.storageInstructions && !order.deliveryNotes && (
              <p className="text-sm text-muted-foreground">
                Không có thông tin bổ sung
              </p>
            )}
          </div>

          {/* Store Info */}
          <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <h3 className="font-semibold text-foreground">Cửa hàng</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">
                  {order.storeName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Mã: {order.storeId}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
