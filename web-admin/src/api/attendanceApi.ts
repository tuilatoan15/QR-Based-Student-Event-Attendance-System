import axiosClient from './axiosClient';

export const attendanceApi = {
  checkIn(qrToken: string) {
    return axiosClient.post('/attendance/checkin', { qr_token: qrToken });
  },
};

