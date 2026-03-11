import axiosClient from './axiosClient';

export type AttendanceRecord = {
  registration_id: number;
  student_name?: string;
  event_id: number;
  event_title?: string;
  checked_in_by: number;
  check_in_time: string;
};

export const attendanceApi = {
  checkIn(qrToken: string) {
    // Backend expects /attendance/scan-qr with body { qr_token: "..." }
    return axiosClient.post('/attendance/scan-qr', { qr_token: qrToken });
  },

  getEventAttendance(eventId: number) {
    return axiosClient.get(`/attendance/event/${eventId}`);
  },
};

