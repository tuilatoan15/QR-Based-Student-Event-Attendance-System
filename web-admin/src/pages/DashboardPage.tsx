import React, { useEffect, useMemo, useState } from 'react';
import { eventApi, type Event } from '../api/eventApi';
import { attendanceApi } from '../api/attendanceApi';
import { usersApi } from '../api/usersApi';
import StatCard from '../components/StatCard';
import AttendanceChart, {
  type AttendanceRatePoint,
} from '../components/AttendanceChart';
import DashboardEventTable, {
  type DashboardEventRow,
} from '../components/DashboardEventTable';

const DashboardPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalRegistrations, setTotalRegistrations] = useState(0);
  const [totalCheckins, setTotalCheckins] = useState(0);
  const [attendanceRateData, setAttendanceRateData] = useState<
    AttendanceRatePoint[]
  >([]);
  const [latestRows, setLatestRows] = useState<DashboardEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []);
  const totalEvents = events.length;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [evs, usersRes] = await Promise.all([
          eventApi.getAllEvents(),
          usersApi.listUsers({ page: 1, limit: 1 }),
        ]);

        setEvents(evs);

        const totalUsers = usersRes.data?.pagination?.total ?? 0;
        setTotalStudents(totalUsers);

        const sortedLatest = [...evs].sort(
          (a: any, b: any) =>
            new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
        );
        const latest = sortedLatest.slice(0, 8);

        // For each event, fetch registrations count + attendance stats
        const perEvent = await Promise.all(
          latest.map(async (ev) => {
            const [regsRes, statsRes] = await Promise.all([
              eventApi.getEventRegistrations(ev.id),
              attendanceApi.getEventAttendanceStats(ev.id),
            ]);

            const regsData = regsRes.data?.data ?? regsRes.data;
            const regs = Array.isArray(regsData) ? regsData : [];

            const stats = statsRes.data?.data ?? statsRes.data;
            const registered = Number(stats?.total_registered ?? regs.length);
            const attended = Number(stats?.total_attended ?? 0);
            const rate = Number(stats?.attendance_rate ?? 0);

            return {
              ev,
              registered,
              attended,
              rate,
            };
          }),
        );

        const registrationsSum = perEvent.reduce(
          (acc, x) => acc + x.registered,
          0,
        );
        const attendedSum = perEvent.reduce((acc, x) => acc + x.attended, 0);
        setTotalRegistrations(registrationsSum);
        setTotalCheckins(attendedSum);

        setAttendanceRateData(
          perEvent
            .map((x) => ({
              name: x.ev.title.length > 18 ? `${x.ev.title.slice(0, 18)}…` : x.ev.title,
              attendance_rate: x.rate,
              registered: x.registered,
              attended: x.attended,
            }))
            .sort((a, b) => b.attendance_rate - a.attendance_rate),
        );

        setLatestRows(
          perEvent.map((x) => ({
            id: x.ev.id,
            title: x.ev.title,
            location: x.ev.location,
            start_time: x.ev.start_time,
            registered: x.registered,
            checked_in: x.attended,
          })),
        );
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

  const upcomingEvents = events.filter((e: any) => new Date(e.start_time) > now)
    .length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h2>
          <div className="mt-1 text-sm text-slate-600">
            Overview of events, registrations, and attendance
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Events" value={totalEvents} icon="📅" />
        <StatCard title="Total Students" value={totalStudents} icon="👨‍🎓" />
        <StatCard
          title="Total Registrations"
          value={totalRegistrations}
          icon="📝"
          subtext={`${upcomingEvents} upcoming`}
        />
        <StatCard title="Total Check-ins" value={totalCheckins} icon="✅" />
      </div>

      <AttendanceChart
        attendanceRateData={attendanceRateData}
        registeredTotal={totalRegistrations}
        attendedTotal={totalCheckins}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-800">
            Latest Events
          </div>
        </div>
        <DashboardEventTable rows={latestRows} />
      </div>
    </div>
  );
};

export default DashboardPage;


