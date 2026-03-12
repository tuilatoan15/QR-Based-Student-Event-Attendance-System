import axiosClient from './axiosClient';

export type AdminUser = {
  id: number;
  full_name: string;
  email: string;
  student_code?: string | null;
  is_active: boolean;
  role_name: string;
  created_at?: string;
  updated_at?: string;
};

export const usersApi = {
  listUsers(params?: { page?: number; limit?: number; search?: string }) {
    return axiosClient.get('/users', { params });
  },

  updateRole(userId: number, role: string) {
    return axiosClient.patch(`/users/${userId}/role`, { role });
  },

  setActive(userId: number, is_active: boolean) {
    return axiosClient.patch(`/users/${userId}/active`, { is_active });
  },
};

