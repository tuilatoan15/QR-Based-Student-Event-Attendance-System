import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { eventApi, type Event } from '../api/eventApi';

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await eventApi.getEvent(Number(id));
        const data = res.data.data ?? res.data;
        setEvent(data as Event);
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            'Unable to load event details. Please try again.',
        );
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  if (loading) return <div>Loading event...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!event) return <div>Event not found.</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800">
          Event Details
        </h2>
        <div className="space-x-2">
          <Link
            to={`/events/${event.id}/edit`}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Edit
          </Link>
          <Link
            to={`/events/${event.id}/participants`}
            className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-200"
          >
            Participants
          </Link>
          <Link
            to={`/attendance/event/${event.id}`}
            className="rounded-md bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-200"
          >
            Attendance
          </Link>
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow space-y-2">
        <div>
          <span className="text-sm font-semibold text-slate-500">Title</span>
          <div className="text-base font-medium text-slate-900">
            {event.title}
          </div>
        </div>
        {event.description && (
          <div>
            <span className="text-sm font-semibold text-slate-500">
              Description
            </span>
            <div className="text-sm text-slate-700">{event.description}</div>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <span className="text-sm font-semibold text-slate-500">
              Location
            </span>
            <div className="text-sm text-slate-700">{event.location}</div>
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-500">
              Max participants
            </span>
            <div className="text-sm text-slate-700">
              {event.max_participants}
            </div>
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-500">
              Start time
            </span>
            <div className="text-sm text-slate-700">
              {new Date(event.start_time).toLocaleString()}
            </div>
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-500">
              End time
            </span>
            <div className="text-sm text-slate-700">
              {new Date(event.end_time).toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;

