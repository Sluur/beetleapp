import axios from "axios";

export const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const refresh = localStorage.getItem("refresh");
        if (!refresh) throw new Error("No hay refresh token");

        const { data } = await axios.post("http://127.0.0.1:8000/api/auth/token/refresh/", { refresh });

        localStorage.setItem("access", data.access);

        api.defaults.headers.common["Authorization"] = `Bearer ${data.access}`;
        original.headers["Authorization"] = `Bearer ${data.access}`;
        return api(original);
      } catch (refreshError) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
