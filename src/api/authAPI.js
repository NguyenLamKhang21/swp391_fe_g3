import API from "./axios";

export const login = (data) => API.post("/auth/login", data);

export const createUser = (data) => API.post("/auth/create", data);
