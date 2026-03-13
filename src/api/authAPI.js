import API from "./axios";

export const login = (data) => API.post("/auth/login", data);

export const createUser = (data) => API.post("/auth/create", data);

export const createOrder = (data) => API.post("/orders", data);

export const getOrdersByStore = (storeId) => API.get(`/orders/orders/${storeId}`);

export const getAllOrders = () => API.get("/orders");

export const getPendingOrders = () => API.get("/orders/pending");

export const getOrderById = (orderId) => API.get(`/orders/${orderId}`);

export const getOrderDetailByOrderId = (orderId) => API.get(`/orders/${orderId}/detail`);

export const confirmOrder = (orderId, priorityLevel) =>
  API.post(`/orders/${orderId}/confirm`, null, { params: { priorityLevel } });

export const cancelOrder = (orderId) => API.post(`/orders/${orderId}/cancel`);

export const updateOrderStatus = (orderId, status) =>
  API.put(`/orders/${orderId}/status`, { newStatus: status });

export const updateOrderPriority = (orderId, newPriority, note = "") =>
  API.patch(`/orders/${orderId}/priority`, { newPriority, note });



export const getCentralKitchenFood = () => API.get("/central_foods");

export const createCentralFood = (data) => API.post("/central_foods", data);

export const getCentralFoodById = (id) => API.get(`/central_foods/${id}`);

export const updateCentralFood = (id, data) => API.put(`/central_foods/${id}`, data);

export const deleteCentralFood = (id) => API.delete(`/central_foods/${id}`);

export const getCentralFoodByStatus = (status) => API.get(`/central_foods/status/${status}`);

export const getCentralFoodExpiringSoon = (days = 7) =>
  API.get("/central_foods/expiring-soon", { params: { days } });

export const getCentralFoodExpired = () => API.get("/central_foods/expired");

export const getOrderByStatus = (status) => API.get(`/orders/status/${status}`);

export const decreaseFoodBaseOnOrder = (orderId) => API.put(`/central_foods/decrease/${orderId}`);
