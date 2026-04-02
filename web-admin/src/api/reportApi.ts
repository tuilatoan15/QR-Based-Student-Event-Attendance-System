import axiosClient from './axiosClient';

export interface Report {
  id: string;
  mongo_id: string;
  user: {
    id: string;
    full_name: string;
    email: string;
    student_code: string;
    avatar?: string;
  };
  type: string;
  title: string;
  content: string;
  status: 'pending' | 'responded' | 'closed';
  admin_reply?: string;
  replied_at?: string;
  created_at: string;
}

const reportApi = {
  getAll: (page: number = 1, limit: number = 20) =>
    axiosClient.get('/reports', { params: { page, limit } }),
  
  reply: (reportId: string, reply: string) =>
    axiosClient.patch(`/reports/${reportId}/reply`, { reply }),
};

export default reportApi;
