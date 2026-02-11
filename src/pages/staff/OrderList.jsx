import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
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
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  PlusCircle,
  Search,
  Eye,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

const OrderList = () => {
  const { orders } = useOrders();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter & sort orders
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(lower) ||
          o.items.some((item) =>
            item.ingredientName.toLowerCase().includes(lower)
          )
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }

    // Sort
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case "amount_high":
        result.sort((a, b) => b.totalAmount - a.totalAmount);
        break;
      case "amount_low":
        result.sort((a, b) => a.totalAmount - b.totalAmount);
        break;
      default:
        break;
    }

    return result;
  }, [orders, searchTerm, statusFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = { all: orders.length };
    Object.values(ORDER_STATUS).forEach((status) => {
      counts[status] = orders.filter((o) => o.status === status).length;
    });
    return counts;
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Danh sách đơn hàng</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý và theo dõi tất cả đơn hàng của cửa hàng
          </p>
        </div>
        <Link to="/staff/orders/create">
          <Button className="gap-2">
            <PlusCircle className="w-4 h-4" />
            Tạo đơn mới
          </Button>
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => {
            setStatusFilter("all");
            setCurrentPage(1);
          }}
          className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            statusFilter === "all"
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground hover:bg-accent"
          }`}
        >
          Tất cả ({statusCounts.all})
        </button>
        {Object.values(ORDER_STATUS).map((status) => {
          const colors = STATUS_COLORS[status];
          const count = statusCounts[status] || 0;
          if (count === 0) return null;
          return (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === status
                  ? `${colors.bg} ${colors.text}`
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {status} ({count})
            </button>
          );
        })}
      </div>

      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã đơn hàng hoặc nguyên liệu..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="sm:w-48"
        >
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
          <option value="amount_high">Giá trị cao → thấp</option>
          <option value="amount_low">Giá trị thấp → cao</option>
        </Select>
      </div>

      {/* Order Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Mã đơn hàng
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Nguyên liệu
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Ưu tiên
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Ngày giao
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Giá trị
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedOrders.map((order) => {
                const statusColor = STATUS_COLORS[order.status];
                const priorityColor = PRIORITY_COLORS[order.priority];
                return (
                  <tr
                    key={order.id}
                    className="hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">{order.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(order.createdAt)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-[200px]">
                        <p className="text-sm text-foreground truncate">
                          {order.items
                            .map((i) => i.ingredientName)
                            .join(", ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.items.length} mặt hàng
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={`${statusColor.bg} ${statusColor.text} border-0`}
                      >
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={`${priorityColor?.bg} ${priorityColor?.text} border-0`}
                      >
                        {order.priority}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-foreground">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {formatDate(order.deliveryDate)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-medium text-foreground">
                        {formatCurrency(order.totalAmount)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link to={`/staff/orders/${order.id}`}>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Eye className="w-4 h-4" />
                          Chi tiết
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-border">
          {paginatedOrders.map((order) => {
            const statusColor = STATUS_COLORS[order.status];
            const priorityColor = PRIORITY_COLORS[order.priority];
            return (
              <Link
                key={order.id}
                to={`/staff/orders/${order.id}`}
                className="block p-4 hover:bg-accent/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-foreground">{order.id}</p>
                  <Badge
                    className={`${statusColor.bg} ${statusColor.text} border-0`}
                  >
                    {order.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {order.items.map((i) => i.ingredientName).join(", ")}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`${priorityColor?.bg} ${priorityColor?.text} border-0 text-xs`}
                    >
                      {order.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(order.deliveryDate)}
                    </span>
                  </div>
                  <p className="font-medium text-foreground">
                    {formatCurrency(order.totalAmount)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Empty state */}
        {paginatedOrders.length === 0 && (
          <div className="p-12 text-center">
            <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">
              Không tìm thấy đơn hàng nào
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchTerm || statusFilter !== "all"
                ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"
                : "Bắt đầu tạo đơn hàng mới"}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Link to="/staff/orders/create" className="inline-block mt-4">
                <Button className="gap-2">
                  <PlusCircle className="w-4 h-4" />
                  Tạo đơn hàng đầu tiên
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} /{" "}
              {filteredOrders.length} đơn hàng
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="w-8 h-8"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="icon"
                    className="w-8 h-8"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                )
              )}
              <Button
                variant="outline"
                size="icon"
                className="w-8 h-8"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderList;
