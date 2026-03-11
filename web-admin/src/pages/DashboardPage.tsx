import React, { useEffect, useState } from 'react';
import { eventApi } from '../api/eventApi';

const DashboardPage: React.FC = () => {
  const [totalEvents, setTotalEvents] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await eventApi.getEvents();
        const data = res.data.data ?? res.data;
        const events = Array.isArray(data) ? data : [];
        setTotalEvents(events.length);

        const now = new Date();
        const upcoming = events.filter(
          (e: any) => new Date(e.start_time) > now,
        );
        setUpcomingEvents(upcoming.length);

        // If backend later adds registration counts, we can sum them here.
        setTotalParticipants(0);
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            'Unable to load dashboard stats. Please try again.',
        );
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-slate-800">Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm text-slate-500">Total Events</div>
          <div className="mt-2 text-2xl font-bold">{totalEvents}</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm text-slate-500">Upcoming Events</div>
          <div className="mt-2 text-2xl font-bold">{upcomingEvents}</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm text-slate-500">Total Participants</div>
          <div className="mt-2 text-2xl font-bold">{totalParticipants}</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

