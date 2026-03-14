import axiosClient from './axiosClient';

export type Event = {
  id: number;
  title: string;
  description?: string | null;
  location: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  category_id?: number | null;
};

export const eventApi = {
  getEvents(params?: { page?: number; limit?: number }) {
    return axiosClient.get('/events', { params });
  },

  getOrganizerEvents(params?: { page?: number; limit?: number }) {
    return axiosClient.get('/events/organizer/events', { params });
  },

  async getAllEvents(isOrganizer = false) {
    const all: any[] = [];
    let page = 1;
    const limit = 100;
    const endpoint = isOrganizer ? '/events/organizer/events' : '/events';
    // Backend uses pagination; loop until empty page
    while (true) {
      const res = await axiosClient.get(endpoint, { params: { page, limit } });
      const payload = res.data?.data ?? res.data;
      const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
      if (!items.length) break;
      all.push(...items);
      if (items.length < limit) break;
      page += 1;
    }
    return all as Event[];
  },

  getEvent(id: number) {
    return axiosClient.get(`/events/${id}`);
  },

  createEvent(payload: Omit<Event, 'id'>) {
    return axiosClient.post('/events', payload);
  },

  updateEvent(id: number, payload: Partial<Omit<Event, 'id'>>) {
    return axiosClient.put(`/events/${id}`, payload);
  },

  deleteEvent(id: number) {
    return axiosClient.delete(`/events/${id}`);
  },

  getEventRegistrations(id: number) {
    return axiosClient.get(`/events/${id}/registrations`);
  },
};

