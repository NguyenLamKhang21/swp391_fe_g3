import { createContext, useContext, useState, useCallback } from "react";
import {
  initialOrders,
  ORDER_STATUS,
  storeInventory,
  ingredients,
} from "@/data/mockData";

const OrderContext = createContext(null);

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrders must be used within an OrderProvider");
  }
  return context;
};

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState(initialOrders);
  const [inventory, setInventory] = useState(storeInventory);

  // Tạo đơn hàng mới - nhận thông tin user từ caller
  const createOrder = useCallback(
    (orderData, userInfo) => {
      const newOrder = {
        id: `ORD-2026-${String(orders.length + 1).padStart(3, "0")}`,
        storeId: userInfo?.storeId || "",
        storeName: userInfo?.storeName || "",
        createdBy: userInfo?.name || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: ORDER_STATUS.PENDING,
        ...orderData,
        statusHistory: [
          {
            status: ORDER_STATUS.PENDING,
            timestamp: new Date().toISOString(),
            note: "Đơn hàng được tạo",
          },
        ],
      };
      setOrders((prev) => [newOrder, ...prev]);
      return newOrder;
    },
    [orders.length]
  );

  // Cập nhật trạng thái đơn hàng (dành cho Supply Coordinator & Central Kitchen)
  const updateOrderStatus = useCallback((orderId, newStatus, note = "", by = "") => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          const historyEntry = {
            status: newStatus,
            timestamp: new Date().toISOString(),
            note,
            ...(by && { by }),
          };
          return {
            ...order,
            status: newStatus,
            updatedAt: new Date().toISOString(),
            statusHistory: [...order.statusHistory, historyEntry],
          };
        }
        return order;
      })
    );
  }, []);

  // Từ chối đơn hàng
  const rejectOrder = useCallback((orderId, reason, rejectedBy) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId) {
          return {
            ...order,
            status: ORDER_STATUS.REJECTED,
            updatedAt: new Date().toISOString(),
            rejectionReason: reason,
            rejectedBy,
            statusHistory: [
              ...order.statusHistory,
              {
                status: ORDER_STATUS.REJECTED,
                timestamp: new Date().toISOString(),
                note: `Đơn hàng bị từ chối: ${reason}`,
                by: rejectedBy,
              },
            ],
          };
        }
        return order;
      })
    );
  }, []);

  // Hủy đơn hàng (chỉ khi Pending)
  const cancelOrder = useCallback((orderId) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id === orderId && order.status === ORDER_STATUS.PENDING) {
          return {
            ...order,
            status: ORDER_STATUS.CANCELLED,
            updatedAt: new Date().toISOString(),
            statusHistory: [
              ...order.statusHistory,
              {
                status: ORDER_STATUS.CANCELLED,
                timestamp: new Date().toISOString(),
                note: "Đơn hàng đã bị hủy bởi cửa hàng",
              },
            ],
          };
        }
        return order;
      })
    );
  }, []);

  // Lấy đơn hàng theo ID
  const getOrderById = useCallback(
    (orderId) => orders.find((o) => o.id === orderId),
    [orders]
  );

  // Kiểm tra tồn kho cửa hàng
  const checkStoreInventory = useCallback(
    (storeId, ingredientId) => {
      const store = inventory[storeId];
      if (!store) return null;
      const item = store.items.find((i) => i.ingredientId === ingredientId);
      const ingredient = ingredients.find((i) => i.id === ingredientId);
      if (!item || !ingredient) return null;
      return {
        ...item,
        ingredientName: ingredient.name,
        unit: ingredient.unit,
        isLow: item.quantity <= item.minLevel,
        isEmpty: item.quantity === 0,
      };
    },
    [inventory]
  );

  // Lấy danh sách nguyên liệu thiếu
  const getLowStockItems = useCallback(
    (storeId) => {
      const store = inventory[storeId];
      if (!store) return [];
      return store.items
        .map((item) => {
          const ingredient = ingredients.find((i) => i.id === item.ingredientId);
          return {
            ...item,
            ingredientName: ingredient?.name,
            unit: ingredient?.unit,
            pricePerUnit: ingredient?.pricePerUnit,
            category: ingredient?.category,
            isLow: item.quantity <= item.minLevel,
            isEmpty: item.quantity === 0,
          };
        })
        .filter((item) => item.isLow);
    },
    [inventory]
  );

  // Thống kê đơn hàng
  const getOrderStats = useCallback(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === ORDER_STATUS.PENDING).length;
    const approved = orders.filter((o) => o.status === ORDER_STATUS.APPROVED).length;
    const inProcess = orders.filter((o) => o.status === ORDER_STATUS.IN_PROCESS).length;
    const delivered = orders.filter((o) => o.status === ORDER_STATUS.DELIVERED).length;
    const rejected = orders.filter((o) => o.status === ORDER_STATUS.REJECTED).length;
    const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);

    return { total, pending, approved, inProcess, delivered, rejected, totalAmount };
  }, [orders]);

  return (
    <OrderContext.Provider
      value={{
        orders,
        inventory,
        createOrder,
        updateOrderStatus,
        rejectOrder,
        cancelOrder,
        getOrderById,
        checkStoreInventory,
        getLowStockItems,
        getOrderStats,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};
