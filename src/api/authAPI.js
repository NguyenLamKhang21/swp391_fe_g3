import API from "./axios";

export const login = (data) => API.post("/auth/login", data);

export const createUser = (data) => API.post("/auth/create", data);

export const createOrder = (data) => API.post("/orders", data);

export const getOrdersByStore = (storeId) => API.get(`/orders/store/${storeId}/pending`);