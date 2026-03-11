import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import EventForm from '../components/EventForm';
import { eventApi, type Event } from '../api/eventApi';

const EditEventPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
            'Unable to load event. Please try again.',
        );
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  const handleSubmit: React.ComponentProps<
    typeof EventForm
  >['onSubmit'] = async (values) => {
    if (!id) return;
    await eventApi.updateEvent(Number(id), values as any);
    navigate('/events');
  };

  if (loading) return <div>Loading event...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!event) return <div>Event not found.</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-800">Edit Event</h2>
      <div className="rounded-lg bg-white p-4 shadow">
        <EventForm initial={event} onSubmit={handleSubmit} />
      </div>
    </div>
  );
};

export default EditEventPage;

