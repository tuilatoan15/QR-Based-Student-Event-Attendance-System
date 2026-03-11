import React, { useEffect, useState } from 'react';
import { eventApi } from '../api/eventApi';
import { attendanceApi } from '../api/attendanceApi';

const DashboardPage: React.FC = () => {
  const [totalEvents, setTotalEvents] = useState(0);
  const [activeEvents, setActiveEvents] = useState(0);
  const [totalRegistrations, setTotalRegistrations] = useState(0);
  const [todaysCheckins, setTodaysCheckins] = useState(0);
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
        const active = events.filter((e: any) => {
          const start = new Date(e.start_time);
          const end = new Date(e.end_time);
          return e.is_active !== false && start <= now && end >= now;
        });
        setActiveEvents(active.length);

        // Approximate total registrations & today's check-ins
        let registrationsCount = 0;
        let todayCheckinsCount = 0;
        const today = new Date();
        const todayDateString = today.toISOString().slice(0, 10);

        for (const ev of events) {
          try {
            const regsRes = await eventApi.getEventRegistrations(ev.id);
            const regsData = regsRes.data.data ?? regsRes.data;
            const regs = Array.isArray(regsData) ? regsData : [];
            registrationsCount += regs.length;

            const attRes = await attendanceApi.getEventAttendance(ev.id);
            const attData = attRes.data.data ?? attRes.data;
            const atts: any[] = Array.isArray(attData) ? attData : [];
            todayCheckinsCount += atts.filter((a) => {
              if (!a.checkin_time) return false;
              const d = new Date(a.checkin_time);
              return d.toISOString().slice(0, 10) === todayDateString;
            }).length;
          } catch {
            // Ignore per-event failures in dashboard aggregates
          }
        }

        setTotalRegistrations(registrationsCount);
        setTodaysCheckins(todayCheckinsCount);
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
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm text-slate-500">Total Events</div>
          <div className="mt-2 text-2xl font-bold">{totalEvents}</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm text-slate-500">Active Events</div>
          <div className="mt-2 text-2xl font-bold">{activeEvents}</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm text-slate-500">Total Registrations</div>
          <div className="mt-2 text-2xl font-bold">{totalRegistrations}</div>
        </div>
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="text-sm text-slate-500">Today&apos;s Check-ins</div>
          <div className="mt-2 text-2xl font-bold">{todaysCheckins}</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;


