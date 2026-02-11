import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useOrders } from "@/contexts/OrderContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  ingredients,
  formatCurrency,
  PRIORITY_LEVELS,
  PRIORITY_COLORS,
} from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ShoppingCart,
  AlertTriangle,
  CheckCircle2,
  Package,
  Search,
  Info,
} from "lucide-react";

const CreateOrder = () => {
  const navigate = useNavigate();
  const { createOrder, checkStoreInventory } = useOrders();
  const { user } = useAuth();

  // Form state
  const [orderItems, setOrderItems] = useState([]);
  const [priority, setPriority] = useState(PRIORITY_LEVELS.MEDIUM);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [storageInstructions, setStorageInstructions] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lấy danh sách category
  const categories = useMemo(() => {
    const cats = [...new Set(ingredients.map((i) => i.category))];
    return ["all", ...cats];
  }, []);

  // Filter ingredients
  const filteredIngredients = useMemo(() => {
    return ingredients.filter((ing) => {
      const matchSearch = ing.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchCategory =
        selectedCategory === "all" || ing.category === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [searchTerm, selectedCategory]);

  // Kiểm tra tồn kho cho mỗi nguyên liệu
  const getInventoryStatus = (ingredientId) => {
    return checkStoreInventory(user?.storeId, ingredientId);
  };

  // Thêm nguyên liệu vào đơn hàng
  const addItem = (ingredient) => {
    const existing = orderItems.find(
      (item) => item.ingredientId === ingredient.id
    );
    if (existing) {
      setOrderItems((prev) =>
        prev.map((item) =>
          item.ingredientId === ingredient.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setOrderItems((prev) => [
        ...prev,
        {
          ingredientId: ingredient.id,
          ingredientName: ingredient.name,
          quantity: 1,
          unit: ingredient.unit,
          pricePerUnit: ingredient.pricePerUnit,
        },
      ]);
    }
  };

  // Cập nhật số lượng
  const updateQuantity = (ingredientId, quantity) => {
    const num = parseFloat(quantity);
    if (isNaN(num) || num < 0) return;
    if (num === 0) {
      removeItem(ingredientId);
      return;
    }
    setOrderItems((prev) =>
      prev.map((item) =>
        item.ingredientId === ingredientId ? { ...item, quantity: num } : item
      )
    );
  };

  // Xóa nguyên liệu
  const removeItem = (ingredientId) => {
    setOrderItems((prev) =>
      prev.filter((item) => item.ingredientId !== ingredientId)
    );
  };

  // Tính tổng tiền
  const totalAmount = useMemo(() => {
    return orderItems.reduce(
      (sum, item) => sum + item.quantity * item.pricePerUnit,
      0
    );
  }, [orderItems]);

  // Kiểm tra form hợp lệ
  const isFormValid =
    orderItems.length > 0 && deliveryDate && priority;

  // Xử lý submit
  const handleSubmit = () => {
    if (!isFormValid) return;
    setShowConfirmDialog(true);
  };

  const confirmOrder = () => {
    setIsSubmitting(true);
    setShowConfirmDialog(false);

    // Simulate API call
    setTimeout(() => {
      const newOrder = createOrder({
        items: orderItems,
        priority,
        deliveryDate,
        deliveryNotes,
        storageInstructions,
        totalAmount,
      }, user);
      setIsSubmitting(false);
      setCreatedOrderId(newOrder.id);
      setShowSuccessDialog(true);
    }, 1000);
  };

  // Lấy min date (ngày mai)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tạo đơn hàng mới</h1>
          <p className="text-muted-foreground mt-0.5">
            Chọn nguyên liệu cần đặt từ Central Kitchen
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Ingredient Selection */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search & Filter */}
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm nguyên liệu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="sm:w-48"
              >
                <option value="all">Tất cả danh mục</option>
                {categories.slice(1).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Ingredient List */}
          <div className="bg-card rounded-xl border border-border">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Package className="w-4 h-4" />
                Danh sách nguyên liệu
              </h3>
            </div>
            <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
              {filteredIngredients.map((ingredient) => {
                const inventoryStatus = getInventoryStatus(ingredient.id);
                const inCart = orderItems.find(
                  (item) => item.ingredientId === ingredient.id
                );

                return (
                  <div
                    key={ingredient.id}
                    className="p-4 hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">
                            {ingredient.name}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {ingredient.category}
                          </Badge>
                          {inCart && (
                            <Badge className="bg-primary/10 text-primary border-0 text-xs">
                              Đã thêm: {inCart.quantity} {ingredient.unit}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(ingredient.pricePerUnit)} / {ingredient.unit}
                          </p>
                          {inventoryStatus && (
                            <span
                              className={`text-xs flex items-center gap-1 ${
                                inventoryStatus.isEmpty
                                  ? "text-red-600"
                                  : inventoryStatus.isLow
                                  ? "text-yellow-600"
                                  : "text-green-600"
                              }`}
                            >
                              {inventoryStatus.isEmpty ? (
                                <AlertTriangle className="w-3 h-3" />
                              ) : inventoryStatus.isLow ? (
                                <AlertTriangle className="w-3 h-3" />
                              ) : (
                                <CheckCircle2 className="w-3 h-3" />
                              )}
                              Tồn kho: {inventoryStatus.quantity} {ingredient.unit}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={inCart ? "outline" : "default"}
                        onClick={() => addItem(ingredient)}
                        className="gap-1 shrink-0 ml-3"
                      >
                        <Plus className="w-4 h-4" />
                        Thêm
                      </Button>
                    </div>
                  </div>
                );
              })}
              {filteredIngredients.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  Không tìm thấy nguyên liệu nào
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="space-y-4">
          {/* Cart items */}
          <div className="bg-card rounded-xl border border-border sticky top-20">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Đơn hàng ({orderItems.length} mặt hàng)
              </h3>
            </div>

            {orderItems.length === 0 ? (
              <div className="p-8 text-center">
                <ShoppingCart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Chưa có nguyên liệu nào
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Chọn nguyên liệu từ danh sách bên trái
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border max-h-[300px] overflow-y-auto">
                {orderItems.map((item) => (
                  <div key={item.ingredientId} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {item.ingredientName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.pricePerUnit)} / {item.unit}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.ingredientId)}
                        className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item.ingredientId, e.target.value)
                        }
                        className="h-8 w-20 text-sm"
                      />
                      <span className="text-xs text-muted-foreground">
                        {item.unit}
                      </span>
                      <span className="text-sm font-medium text-foreground ml-auto">
                        {formatCurrency(item.quantity * item.pricePerUnit)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            {orderItems.length > 0 && (
              <div className="p-4 border-t border-border bg-accent/30">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">Tổng cộng</span>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Order Details */}
          <div className="bg-card rounded-xl border border-border p-4 space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Info className="w-4 h-4" />
              Thông tin giao hàng
            </h3>

            <div className="space-y-2">
              <Label htmlFor="priority">Mức độ ưu tiên *</Label>
              <Select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                {Object.values(PRIORITY_LEVELS).map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryDate">Ngày giao hàng *</Label>
              <Input
                id="deliveryDate"
                type="date"
                min={getMinDate()}
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storageInstructions">Cách bảo quản</Label>
              <Select
                id="storageInstructions"
                value={storageInstructions}
                onChange={(e) => setStorageInstructions(e.target.value)}
              >
                <option value="">-- Chọn cách bảo quản --</option>
                <option value="Bảo quản lạnh 2-8°C">Bảo quản lạnh 2-8°C</option>
                <option value="Giữ lạnh trong quá trình vận chuyển">
                  Giữ lạnh trong quá trình vận chuyển
                </option>
                <option value="Bảo quản nơi khô ráo">Bảo quản nơi khô ráo</option>
                <option value="Bảo quản nhiệt độ phòng">
                  Bảo quản nhiệt độ phòng
                </option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryNotes">Ghi chú giao hàng</Label>
              <Textarea
                id="deliveryNotes"
                placeholder="Ví dụ: Giao trước 8h sáng, liên hệ trước khi giao..."
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              className="w-full gap-2"
              size="lg"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Đang xử lý...
                </div>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  Gửi đơn hàng
                </>
              )}
            </Button>

            {!isFormValid && orderItems.length > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                Vui lòng chọn ngày giao hàng để tiếp tục
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
      >
        <DialogClose onClose={() => setShowConfirmDialog(false)} />
        <DialogHeader>
          <DialogTitle>Xác nhận đơn hàng</DialogTitle>
          <DialogDescription>
            Bạn có chắc muốn gửi đơn hàng này đến Supply Coordinator?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 my-4">
          <div className="bg-accent/50 rounded-lg p-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Số mặt hàng:</span>
              <span className="font-medium">{orderItems.length}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-muted-foreground">Tổng giá trị:</span>
              <span className="font-bold text-primary">
                {formatCurrency(totalAmount)}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-muted-foreground">Mức ưu tiên:</span>
              <Badge
                className={`${PRIORITY_COLORS[priority]?.bg} ${PRIORITY_COLORS[priority]?.text} border-0`}
              >
                {priority}
              </Badge>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-muted-foreground">Ngày giao:</span>
              <span className="font-medium">
                {deliveryDate
                  ? new Date(deliveryDate).toLocaleDateString("vi-VN")
                  : "---"}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setShowConfirmDialog(false)}
          >
            Hủy
          </Button>
          <Button onClick={confirmOrder}>Xác nhận gửi</Button>
        </DialogFooter>
      </Dialog>

      {/* Success Dialog */}
      <Dialog
        open={showSuccessDialog}
        onClose={() => {
          setShowSuccessDialog(false);
          navigate("/staff/orders");
        }}
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            Đơn hàng đã được tạo!
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            Mã đơn hàng: <span className="font-bold">{createdOrderId}</span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Đơn hàng đang chờ Supply Coordinator xét duyệt.
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowSuccessDialog(false);
                navigate("/staff/orders");
              }}
            >
              Danh sách đơn hàng
            </Button>
            <Button
              onClick={() => {
                setShowSuccessDialog(false);
                navigate(`/staff/orders/${createdOrderId}`);
              }}
            >
              Xem chi tiết
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default CreateOrder;
