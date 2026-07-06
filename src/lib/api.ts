import axios from "axios";

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api",
  timeout: 8000
});

