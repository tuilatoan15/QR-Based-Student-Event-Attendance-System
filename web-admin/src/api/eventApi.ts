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
  getEvents() {
    return axiosClient.get('/events');
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

