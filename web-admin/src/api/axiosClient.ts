import axios from 'axios';
import { emitAuthLogout } from '../utils/authEvents';
import { notifyError } from '../utils/notify';

const DEFAULT_DEV_API_BASE_URL = 'http://localhost:5000/api';

const axiosClient = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? DEFAULT_DEV_API_BASE_URL : '/api'),
  withCredentials: true,
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

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Something went wrong. Please try again.';

    // Avoid spamming toasts for explicit/handled auth flows.
    if (status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      emitAuthLogout(message);
      notifyError('Session expired. Please log in again.');
    } else if (status) {
      notifyError(message);
    } else {
      notifyError('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  },
);

export default axiosClient;

