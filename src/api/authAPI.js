import API from "./axios";

export const getAllUsers = () => API.get("/auth");

export const login = (data) => API.post("/auth/login", data);

export const createUser = (data) => API.post("/auth/create", data);

export const createOrder = (data) => API.post("/orders", data);

export const getOrdersByStore = (storeId) => API.get(`/orders/orders/${encodeURIComponent(storeId)}`);

export const getAllOrders = () => API.get("/orders");

export const getPendingOrders = () => API.get("/orders/pending");

export const getOrderById = (orderId) => API.get(`/orders/${orderId}`);

export const getOrderDetailByOrderId = (orderId) => API.get(`/orders/${orderId}/detail`);

export const confirmOrder = (orderId, priorityLevel) =>
  API.post(`/orders/${orderId}/confirm`, null, { params: { priorityLevel } });

export const cancelOrder = (orderId, reason = "") =>
  API.post(
    `/orders/${orderId}/cancel`,
    null,
    { params: reason?.trim() ? { reason: reason.trim() } : {} }
  );

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

export const changePaymentOption = (orderId, newOption) =>
  API.patch(`/orders/change-option/${orderId}`, null, { params: { newOption } });

export const changePaymentMethod = (orderId, newMethod) =>
  API.patch(`/orders/change-method/${orderId}`, null, { params: { newMethod } });

// ── VNPay Payment ──
export const createPaymentByOrder = (orderId) =>
  API.post(`/payment/create-by-order/${orderId}`);

export const createDebtPayment = (storeId) =>
  API.post(`/payment/debt/${encodeURIComponent(storeId)}`);

export const refundPayment = (orderId) =>
  API.post(`/payment/refund/${orderId}`);

export const getPaymentByTxnRef = (txnRef) =>
  API.get(`/payment/${txnRef}`);

export const vnpayReturn = () => API.get("/payment/vnpay-return");

// ── Franchise Store ──
export const getAllStore = () => API.get("/franchise-stores");

export const getStorePaymentRecords = (storeId) =>
  API.get(`/franchise-stores/${encodeURIComponent(storeId)}/payment-records`);

export const createNewFranchiseStore = (data) => API.post("/franchise-stores", data);

//address controller
export const getProvinceId = () => API.get("/api/address/provinces");


export const getDistrictAddress = (provinceId) => API.get(`/api/address/districts`, { params: { provinceId } });


export const getWardAddress = (districtId) => API.get(`/api/address/wards`, {params: {districtId}});