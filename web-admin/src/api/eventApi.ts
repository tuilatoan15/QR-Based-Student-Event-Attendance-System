import axiosClient from './axiosClient';

export type Event = {
  id: string;
  title: string;
  description?: string | null;
  images?: string[] | string | null;
  location: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  category_id?: string | null;
  is_active?: boolean;
  registration_count?: number;
  attendance_count?: number;
};

export const eventApi = {
  getEvents(params?: { page?: number; limit?: number; search?: string }) {
    return axiosClient.get('/events', { params });
  },

  getOrganizerEvents(params?: { page?: number; limit?: number; search?: string }) {
    return axiosClient.get('/events/organizer/events', { params });
  },

  async getAllEvents(isOrganizer = false) {
    const all: Event[] = [];
    let page = 1;
    const limit = 100;
    const endpoint = isOrganizer ? '/events/organizer/events' : '/events';

    while (true) {
      const res = await axiosClient.get(endpoint, { params: { page, limit } });
      const items = res.data?.data ?? [];
      if (!Array.isArray(items) || items.length === 0) break;
      all.push(...items);
      if (items.length < limit) break;
      page += 1;
    }

    return all;
  },

  getEvent(id: string) {
    return axiosClient.get(`/events/${id}`);
  },

  createEvent(payload: Record<string, unknown>) {
    return axiosClient.post('/events', payload);
  },

  updateEvent(id: string, payload: Record<string, unknown>) {
    return axiosClient.put(`/events/${id}`, payload);
  },

  deleteEvent(id: string) {
    return axiosClient.delete(`/events/${id}`);
  },

  getEventRegistrations(id: string) {
    return axiosClient.get(`/events/${id}/registrations`);
  },
};
