import axiosClient from './axiosClient';

export type OrganizerInfo = {
  user_id: string;
  full_name: string;
  email: string;
  organization_name: string;
  position: string | null;
  phone: string | null;
  bio: string | null;
  website: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
};

export const adminApi = {
  getOrganizers(status: string = 'pending') {
    return axiosClient.get('/admin/organizers', { params: { status } });
  },
  approveOrganizer(id: string) {
    return axiosClient.patch(`/admin/organizers/${id}/approve`);
  },
  rejectOrganizer(id: string, reason: string) {
    return axiosClient.patch(`/admin/organizers/${id}/reject`, { reason });
  }
};
