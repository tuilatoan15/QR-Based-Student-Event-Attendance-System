import axiosClient from './axiosClient';

export type AttendanceRecord = {
  registration_id: number;
  student_name?: string;
  email?: string;
  student_code?: string | null;
  attendance_status?: string;
  event_id?: number;
  event_title?: string;
  check_in_time: string;
};

export type AttendanceListRecord = {
  attendance_id: number;
  registration_id: number;
  check_in_time: string;
  attendance_status?: string;
  event_id: number;
  event_title: string;
  registration_status: string;
  user_id: number;
  student_name: string;
  email: string;
  student_code?: string | null;
};

export type EventAttendanceStats = {
  eventId: number;
  total_registered: number;
  total_attended: number;
  attendance_rate: number;
};

export const attendanceApi = {
  checkIn(qrToken: string) {
    // Backend expects /attendance/scan-qr with body { qr_token: "..." }
    return axiosClient.post('/attendance/scan-qr', { qr_token: qrToken });
  },

  getEventAttendance(eventId: number) {
    return axiosClient.get(`/attendance/event/${eventId}`);
  },

  getEventAttendanceStats(eventId: number) {
    return axiosClient.get(`/attendance/event/${eventId}/stats`);
  },

  listAttendance(params?: { event_id?: number; search?: string }) {
    return axiosClient.get('/attendance', { params });
  },

  manualCheckIn(registrationId: number) {
    return axiosClient.post('/attendance/manual-checkin', {
      registration_id: registrationId,
    });
  },

  manualCheckinByStudent(studentCode: string, eventId: number) {
    return axiosClient.post('/attendance/manual-checkin', {
      student_code: studentCode,
      event_id: eventId,
    });
  },
};

