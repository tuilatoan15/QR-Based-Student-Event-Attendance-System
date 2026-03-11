import React from 'react';
import { useNavigate } from 'react-router-dom';
import EventForm from '../components/EventForm';
import { eventApi } from '../api/eventApi';

const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit: React.ComponentProps<
    typeof EventForm
  >['onSubmit'] = async (values) => {
    await eventApi.createEvent(values as any);
    navigate('/events');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-800">Create Event</h2>
      <div className="rounded-lg bg-white p-4 shadow">
        <EventForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
};

export default CreateEventPage;

