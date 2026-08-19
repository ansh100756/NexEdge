import { request } from "../../config/api";

export const authService = {
  getMe() {
    return request("/auth/get-me");
  },

  login(email, password) {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  register(email, password) {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  logout() {
    return request("/auth/logout", { method: "POST" });
  },
};
