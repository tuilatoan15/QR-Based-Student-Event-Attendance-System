import axiosClient from './axiosClient';

export type AttendanceRecord = {
  id?: string;
  attendance_id?: string;
  registration_id: string;
  student_name?: string;
  email?: string;
  student_code?: string | null;
  attendance_status?: string;
  event_id?: string;
  event_title?: string;
  check_in_time: string;
};

export type AttendanceListRecord = {
  attendance_id: string;
  registration_id: string;
  check_in_time: string;
  attendance_status?: string;
  event_id: string;
  event_title: string;
  registration_status: string;
  user_id: string;
  student_name: string;
  email: string;
  student_code?: string | null;
  registered_at: string;
};

export type EventAttendanceStats = {
  eventId: string;
  total_registered: number;
  total_attended: number;
  attendance_rate: number;
};

export const attendanceApi = {
  checkIn(qrToken: string) {
    return axiosClient.post('/attendance/scan-qr', { qr_token: qrToken });
  },

  getEventAttendance(eventId: string) {
    return axiosClient.get(`/attendance/event/${eventId}`);
  },

  getEventAttendanceStats(eventId: string) {
    return axiosClient.get(`/attendance/event/${eventId}/stats`);
  },

  getBulkEventStats(eventIds: string[]) {
    if (eventIds.length === 0) return Promise.resolve({ data: { data: [] } });
    return axiosClient.get(`/attendance/bulk-stats?eventIds=${eventIds.join(',')}`);
  },

  listAttendance(params?: { event_id?: string; search?: string }) {
    return axiosClient.get('/attendance', { params });
  },

  manualCheckinByStudent(studentCode: string, eventId: string) {
    return axiosClient.post('/attendance/manual-checkin', {
      student_code: studentCode,
      event_id: eventId,
    });
  },
};
