// Mock data cho hệ thống CentralKitchen - Flow 1: Franchise Store Staff Order

// Danh sách thành phần/nguyên liệu
export const ingredients = [
  { id: "ING001", name: "Bột mì", unit: "kg", category: "Nguyên liệu khô", pricePerUnit: 15000 },
  { id: "ING002", name: "Đường", unit: "kg", category: "Nguyên liệu khô", pricePerUnit: 20000 },
  { id: "ING003", name: "Bơ", unit: "kg", category: "Sữa & Bơ", pricePerUnit: 120000 },
  { id: "ING004", name: "Trứng gà", unit: "quả", category: "Trứng", pricePerUnit: 4000 },
  { id: "ING005", name: "Sữa tươi", unit: "lít", category: "Sữa & Bơ", pricePerUnit: 30000 },
  { id: "ING006", name: "Kem whipping", unit: "lít", category: "Sữa & Bơ", pricePerUnit: 85000 },
  { id: "ING007", name: "Chocolate đen", unit: "kg", category: "Chocolate", pricePerUnit: 180000 },
  { id: "ING008", name: "Bột cacao", unit: "kg", category: "Chocolate", pricePerUnit: 95000 },
  { id: "ING009", name: "Vani extract", unit: "lít", category: "Hương liệu", pricePerUnit: 250000 },
  { id: "ING010", name: "Bột nở", unit: "kg", category: "Nguyên liệu khô", pricePerUnit: 35000 },
  { id: "ING011", name: "Muối", unit: "kg", category: "Nguyên liệu khô", pricePerUnit: 8000 },
  { id: "ING012", name: "Dầu ăn", unit: "lít", category: "Dầu", pricePerUnit: 40000 },
  { id: "ING013", name: "Phô mai cream", unit: "kg", category: "Sữa & Bơ", pricePerUnit: 150000 },
  { id: "ING014", name: "Dâu tây", unit: "kg", category: "Trái cây", pricePerUnit: 200000 },
  { id: "ING015", name: "Matcha bột", unit: "kg", category: "Hương liệu", pricePerUnit: 350000 },
];

// Tồn kho của cửa hàng Franchise (Store inventory)
export const storeInventory = {
  "STORE001": {
    storeName: "CentralKitchen - Chi nhánh Quận 1",
    items: [
      { ingredientId: "ING001", quantity: 20, minLevel: 10 },
      { ingredientId: "ING002", quantity: 8, minLevel: 5 },
      { ingredientId: "ING003", quantity: 3, minLevel: 5 },
      { ingredientId: "ING004", quantity: 50, minLevel: 30 },
      { ingredientId: "ING005", quantity: 10, minLevel: 8 },
      { ingredientId: "ING006", quantity: 2, minLevel: 3 },
      { ingredientId: "ING007", quantity: 1, minLevel: 2 },
      { ingredientId: "ING008", quantity: 3, minLevel: 2 },
      { ingredientId: "ING009", quantity: 0.5, minLevel: 1 },
      { ingredientId: "ING010", quantity: 5, minLevel: 3 },
      { ingredientId: "ING011", quantity: 10, minLevel: 5 },
      { ingredientId: "ING012", quantity: 8, minLevel: 5 },
      { ingredientId: "ING013", quantity: 2, minLevel: 3 },
      { ingredientId: "ING014", quantity: 0, minLevel: 2 },
      { ingredientId: "ING015", quantity: 0.3, minLevel: 0.5 },
    ],
  },
};

// Tồn kho của Central Kitchen
export const centralKitchenInventory = [
  { ingredientId: "ING001", quantity: 200, minLevel: 50 },
  { ingredientId: "ING002", quantity: 100, minLevel: 30 },
  { ingredientId: "ING003", quantity: 50, minLevel: 20 },
  { ingredientId: "ING004", quantity: 500, minLevel: 100 },
  { ingredientId: "ING005", quantity: 80, minLevel: 30 },
  { ingredientId: "ING006", quantity: 30, minLevel: 10 },
  { ingredientId: "ING007", quantity: 15, minLevel: 5 },
  { ingredientId: "ING008", quantity: 25, minLevel: 10 },
  { ingredientId: "ING009", quantity: 5, minLevel: 2 },
  { ingredientId: "ING010", quantity: 40, minLevel: 15 },
  { ingredientId: "ING011", quantity: 60, minLevel: 20 },
  { ingredientId: "ING012", quantity: 50, minLevel: 20 },
  { ingredientId: "ING013", quantity: 20, minLevel: 8 },
  { ingredientId: "ING014", quantity: 10, minLevel: 5 },
  { ingredientId: "ING015", quantity: 3, minLevel: 1 },
];

// Trạng thái đơn hàng
export const ORDER_STATUS = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  IN_PROCESS: "In Process",
  COOKING_DONE: "Cooking Done",
  DELIVERING: "Delivering",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

// Màu sắc cho từng trạng thái
export const STATUS_COLORS = {
  [ORDER_STATUS.PENDING]: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-300" },
  [ORDER_STATUS.APPROVED]: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-300" },
  [ORDER_STATUS.REJECTED]: { bg: "bg-red-100", text: "text-red-800", border: "border-red-300" },
  [ORDER_STATUS.IN_PROCESS]: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-300" },
  [ORDER_STATUS.COOKING_DONE]: { bg: "bg-green-100", text: "text-green-800", border: "border-green-300" },
  [ORDER_STATUS.DELIVERING]: { bg: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-300" },
  [ORDER_STATUS.DELIVERED]: { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-300" },
  [ORDER_STATUS.CANCELLED]: { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-300" },
};

// Mức độ ưu tiên
export const PRIORITY_LEVELS = {
  LOW: "Thấp",
  MEDIUM: "Trung bình",
  HIGH: "Cao",
  URGENT: "Khẩn cấp",
};

export const PRIORITY_COLORS = {
  [PRIORITY_LEVELS.LOW]: { bg: "bg-gray-100", text: "text-gray-700" },
  [PRIORITY_LEVELS.MEDIUM]: { bg: "bg-blue-100", text: "text-blue-700" },
  [PRIORITY_LEVELS.HIGH]: { bg: "bg-orange-100", text: "text-orange-700" },
  [PRIORITY_LEVELS.URGENT]: { bg: "bg-red-100", text: "text-red-700" },
};

// Mock orders
export const initialOrders = [
  {
    id: "ORD-2026-001",
    storeId: "STORE001",
    storeName: "CentralKitchen - Chi nhánh Quận 1",
    createdBy: "Nguyễn Văn A",
    createdAt: "2026-02-08T08:30:00",
    updatedAt: "2026-02-08T10:15:00",
    status: ORDER_STATUS.DELIVERED,
    priority: PRIORITY_LEVELS.HIGH,
    deliveryDate: "2026-02-09",
    deliveryNotes: "Giao trước 8h sáng",
    storageInstructions: "Bảo quản lạnh 2-8°C",
    items: [
      { ingredientId: "ING001", ingredientName: "Bột mì", quantity: 15, unit: "kg", pricePerUnit: 15000 },
      { ingredientId: "ING003", ingredientName: "Bơ", quantity: 5, unit: "kg", pricePerUnit: 120000 },
      { ingredientId: "ING004", ingredientName: "Trứng gà", quantity: 100, unit: "quả", pricePerUnit: 4000 },
    ],
    totalAmount: 1225000,
    statusHistory: [
      { status: ORDER_STATUS.PENDING, timestamp: "2026-02-08T08:30:00", note: "Đơn hàng được tạo" },
      { status: ORDER_STATUS.APPROVED, timestamp: "2026-02-08T09:00:00", note: "Supply Coordinator đã duyệt", by: "Trần Thị B" },
      { status: ORDER_STATUS.IN_PROCESS, timestamp: "2026-02-08T09:30:00", note: "Central Kitchen đang chuẩn bị" },
      { status: ORDER_STATUS.COOKING_DONE, timestamp: "2026-02-08T14:00:00", note: "Hoàn thành chuẩn bị" },
      { status: ORDER_STATUS.DELIVERING, timestamp: "2026-02-09T06:00:00", note: "Đang giao hàng" },
      { status: ORDER_STATUS.DELIVERED, timestamp: "2026-02-09T07:45:00", note: "Đã giao thành công" },
    ],
  },
  {
    id: "ORD-2026-002",
    storeId: "STORE001",
    storeName: "CentralKitchen - Chi nhánh Quận 1",
    createdBy: "Nguyễn Văn A",
    createdAt: "2026-02-09T10:00:00",
    updatedAt: "2026-02-09T11:30:00",
    status: ORDER_STATUS.REJECTED,
    priority: PRIORITY_LEVELS.MEDIUM,
    deliveryDate: "2026-02-10",
    deliveryNotes: "",
    storageInstructions: "Bảo quản nơi khô ráo",
    items: [
      { ingredientId: "ING007", ingredientName: "Chocolate đen", quantity: 10, unit: "kg", pricePerUnit: 180000 },
      { ingredientId: "ING015", ingredientName: "Matcha bột", quantity: 3, unit: "kg", pricePerUnit: 350000 },
    ],
    totalAmount: 2850000,
    rejectionReason: "Số lượng yêu cầu vượt quá giới hạn tồn kho hiện tại. Vui lòng giảm số lượng hoặc đặt lại sau 3 ngày.",
    rejectedBy: "Trần Thị B",
    statusHistory: [
      { status: ORDER_STATUS.PENDING, timestamp: "2026-02-09T10:00:00", note: "Đơn hàng được tạo" },
      { status: ORDER_STATUS.REJECTED, timestamp: "2026-02-09T11:30:00", note: "Đơn hàng bị từ chối", by: "Trần Thị B" },
    ],
  },
  {
    id: "ORD-2026-003",
    storeId: "STORE001",
    storeName: "CentralKitchen - Chi nhánh Quận 1",
    createdBy: "Nguyễn Văn A",
    createdAt: "2026-02-10T09:15:00",
    updatedAt: "2026-02-10T09:15:00",
    status: ORDER_STATUS.PENDING,
    priority: PRIORITY_LEVELS.HIGH,
    deliveryDate: "2026-02-11",
    deliveryNotes: "Giao buổi sáng",
    storageInstructions: "Giữ lạnh trong quá trình vận chuyển",
    items: [
      { ingredientId: "ING005", ingredientName: "Sữa tươi", quantity: 20, unit: "lít", pricePerUnit: 30000 },
      { ingredientId: "ING006", ingredientName: "Kem whipping", quantity: 5, unit: "lít", pricePerUnit: 85000 },
      { ingredientId: "ING013", ingredientName: "Phô mai cream", quantity: 8, unit: "kg", pricePerUnit: 150000 },
    ],
    totalAmount: 2225000,
    statusHistory: [
      { status: ORDER_STATUS.PENDING, timestamp: "2026-02-10T09:15:00", note: "Đơn hàng được tạo" },
    ],
  },
  {
    id: "ORD-2026-004",
    storeId: "STORE001",
    storeName: "CentralKitchen - Chi nhánh Quận 1",
    createdBy: "Nguyễn Văn A",
    createdAt: "2026-02-10T14:00:00",
    updatedAt: "2026-02-11T08:00:00",
    status: ORDER_STATUS.IN_PROCESS,
    priority: PRIORITY_LEVELS.URGENT,
    deliveryDate: "2026-02-11",
    deliveryNotes: "Khẩn cấp - cần giao trước 12h trưa",
    storageInstructions: "Bảo quản lạnh",
    items: [
      { ingredientId: "ING003", ingredientName: "Bơ", quantity: 10, unit: "kg", pricePerUnit: 120000 },
      { ingredientId: "ING004", ingredientName: "Trứng gà", quantity: 200, unit: "quả", pricePerUnit: 4000 },
      { ingredientId: "ING001", ingredientName: "Bột mì", quantity: 25, unit: "kg", pricePerUnit: 15000 },
      { ingredientId: "ING002", ingredientName: "Đường", quantity: 10, unit: "kg", pricePerUnit: 20000 },
    ],
    totalAmount: 2575000,
    statusHistory: [
      { status: ORDER_STATUS.PENDING, timestamp: "2026-02-10T14:00:00", note: "Đơn hàng được tạo" },
      { status: ORDER_STATUS.APPROVED, timestamp: "2026-02-10T14:30:00", note: "Duyệt khẩn cấp", by: "Trần Thị B" },
      { status: ORDER_STATUS.IN_PROCESS, timestamp: "2026-02-11T08:00:00", note: "Central Kitchen đang sản xuất - kho không đủ, cần làm thêm" },
    ],
  },
  {
    id: "ORD-2026-005",
    storeId: "STORE001",
    storeName: "CentralKitchen - Chi nhánh Quận 1",
    createdBy: "Nguyễn Văn A",
    createdAt: "2026-02-11T07:00:00",
    updatedAt: "2026-02-11T07:00:00",
    status: ORDER_STATUS.PENDING,
    priority: PRIORITY_LEVELS.MEDIUM,
    deliveryDate: "2026-02-12",
    deliveryNotes: "",
    storageInstructions: "Bảo quản nhiệt độ phòng",
    items: [
      { ingredientId: "ING010", ingredientName: "Bột nở", quantity: 5, unit: "kg", pricePerUnit: 35000 },
      { ingredientId: "ING011", ingredientName: "Muối", quantity: 3, unit: "kg", pricePerUnit: 8000 },
      { ingredientId: "ING012", ingredientName: "Dầu ăn", quantity: 10, unit: "lít", pricePerUnit: 40000 },
    ],
    totalAmount: 599000,
    statusHistory: [
      { status: ORDER_STATUS.PENDING, timestamp: "2026-02-11T07:00:00", note: "Đơn hàng được tạo" },
    ],
  },
];

// Mock user hiện tại (Franchise Store Staff)
export const currentUser = {
  id: "USR001",
  name: "Nguyễn Văn A",
  email: "nguyenvana@centralkitchen.vn",
  role: "franchise_staff",
  storeId: "STORE001",
  storeName: "CentralKitchen - Chi nhánh Quận 1",
  avatar: null,
};

// Lấy ingredient theo ID
export const getIngredientById = (id) => ingredients.find((i) => i.id === id);

// Format tiền VNĐ
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

// Format ngày giờ
export const formatDateTime = (dateStr) => {
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
};

// Format ngày
export const formatDate = (dateStr) => {
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(dateStr));
};
