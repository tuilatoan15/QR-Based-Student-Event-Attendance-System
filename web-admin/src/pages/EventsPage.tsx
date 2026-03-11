import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventApi, type Event } from '../api/eventApi';
import EventTable from '../components/EventTable';

const EventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await eventApi.getEvents();
      const data = res.data.data ?? res.data;
      setEvents(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || 'Unable to fetch events. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await eventApi.deleteEvent(id);
      await loadEvents();
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          'Failed to delete event. Please try again.',
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800">Events</h2>
        <Link
          to="/events/create"
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Add Event
        </Link>
      </div>
      {loading && <div>Loading events...</div>}
      {error && <div className="text-red-600">{error}</div>}
      {!loading && !error && <EventTable events={events} onDelete={handleDelete} />}
    </div>
  );
};

export default EventsPage;

