import API from "./axios";

export const login = (data) => API.post("/auth/login", data);

export const createUser = (data) => API.post("/auth/create", data);

export const createOrder = (data) => API.post("/orders", data);

export const getOrdersByStore = (storeId) => API.get(`/orders/orders/${storeId}`);

export const getAllOrders = () => API.get("/orders");

export const getPendingOrders = () => API.get("/orders/pending");

export const getOrderById = (orderId) => API.get(`/orders/${orderId}`);

export const getOrderDetailByOrderId = (orderId) => API.get(`/orders/${orderId}/detail`);

export const confirmOrder = (orderId) => API.post(`/orders/${orderId}/confirm`);

export const cancelOrder = (orderId) => API.post(`/orders/${orderId}/cancel`);

export const updateOrderStatus = (orderId, status) =>
  API.put(`/orders/${orderId}/status`, { statusOrder: status });

export const updateOrderPriority = (orderId, priorityLevel) =>
  API.patch(`/orders/${orderId}/priority`, { priorityLevel });



export const getCentralKitchenFood = () => API.get("/central_foods");

export const getOrderByStatus = (status) => API.get(`/orders/status/${status}`);
