import axios from 'axios';

// Use relative base URL so the frontend can be served behind any host,
// with the backend mounted at /api (matches backend configuration).
const axiosClient = axios.create({
  baseURL: '/api',
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    (config.headers as any) = {
      ...(config.headers as any),
      Authorization: `Bearer ${token}`,
    };
  }
  return config;
});

export default axiosClient;

