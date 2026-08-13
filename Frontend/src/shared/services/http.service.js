import axios from "axios";
import { API_CONFIG } from "../../config/api.config";

export const httpService = axios.create({
  baseURL: API_CONFIG.baseURL,
  withCredentials: API_CONFIG.withCredentials,
  timeout: API_CONFIG.timeout,
  headers: { "Content-Type": "application/json" },
});
