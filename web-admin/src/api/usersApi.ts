import axiosClient from './axiosClient';

export type AdminUser = {
  id: string;
  full_name: string;
  email: string;
  student_code?: string | null;
  is_active: boolean;
  role_name: string;
  avatar?: string | null;
  created_at?: string;
  updated_at?: string;
};

export const usersApi = {
  listUsers(params?: { page?: number; limit?: number; search?: string }) {
    return axiosClient.get('/users', { params });
  },

  updateRole(userId: string, role: string) {
    return axiosClient.patch(`/users/${userId}/role`, { role });
  },

  setActive(userId: string, is_active: boolean) {
    return axiosClient.patch(`/users/${userId}/active`, { is_active });
  },

  getOrganizerProfile() {
    return axiosClient.get('/users/me/organizer-profile');
  },

  updateOrganizerProfile(data: any) {
    return axiosClient.patch('/users/me/organizer-profile', data);
  },

  updateAvatar(formData: FormData) {
    return axiosClient.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  changePassword(data: any) {
    return axiosClient.patch('/users/me/password', data);
  },
};
