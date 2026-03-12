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
  const [attendanceRateData, setAttendanceRateData] = useState<AttendanceRatePoint[]>([]);
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
            return { ev, registered, attended, rate };
          }),
        );

        const registrationsSum = perEvent.reduce((acc, x) => acc + x.registered, 0);
        const attendedSum = perEvent.reduce((acc, x) => acc + x.attended, 0);
        setTotalRegistrations(registrationsSum);
        setTotalCheckins(attendedSum);

        setAttendanceRateData(
          perEvent
            .map((x) => ({
              name: x.ev.title.length > 16 ? `${x.ev.title.slice(0, 16)}…` : x.ev.title,
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
        setError(err?.response?.data?.message || 'Không thể tải dữ liệu dashboard.');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const upcomingEvents = events.filter((e: any) => new Date(e.start_time) > now).length;

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: 300, flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 36, height: 36,
          border: '3px solid #e0eeff',
          borderTopColor: '#0284c7',
          borderRadius: '50%',
          animation: 'spin .7s linear infinite',
        }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <span style={{ color: '#94a3b8', fontSize: 13 }}>Đang tải dữ liệu...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: '#fff1f2', border: '1px solid #fecaca',
        borderRadius: 12, padding: '16px 20px', color: '#be123c', fontSize: 13,
      }}>
        ⚠️ {error}
      </div>
    );
  }

  return (
    <>
      <style>{`
        .db-root { display: flex; flex-direction: column; gap: 24px; }

        .db-header { margin-bottom: 4px; }
        .db-title {
          font-size: 22px; font-weight: 800; color: #0f172a;
          letter-spacing: -0.5px; margin-bottom: 4px;
        }
        .db-subtitle { font-size: 13px; color: #94a3b8; }

        .db-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        @media(max-width:900px){ .db-stats{ grid-template-columns: repeat(2,1fr); } }
        @media(max-width:500px){ .db-stats{ grid-template-columns: 1fr; } }

        .db-section-title {
          font-size: 14px; font-weight: 700; color: #0f172a;
          margin-bottom: 12px;
          display: flex; align-items: center; gap: 8px;
        }
        .db-section-title::after {
          content: ''; flex: 1; height: 1px; background: #e8f2ff;
        }
      `}</style>

      <div className="db-root">
        {/* Header */}
        <div className="db-header">
          <div className="db-title">Dashboard</div>
          <div className="db-subtitle">Tổng quan sự kiện, đăng ký và điểm danh</div>
        </div>

        {/* Stat cards */}
        <div className="db-stats">
          <StatCard
            title="Tổng sự kiện"
            value={totalEvents}
            icon={
              <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
                <rect x="3" y="4" width="14" height="14" rx="2" stroke="#1d4ed8" strokeWidth="1.6"/>
                <path d="M13 2v4M7 2v4M3 8h14" stroke="#1d4ed8" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            }
            subtext={`${upcomingEvents} sắp diễn ra`}
          />
          <StatCard
            title="Sinh viên"
            value={totalStudents}
            icon={
              <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
                <circle cx="8" cy="6" r="3" stroke="#15803d" strokeWidth="1.6"/>
                <path d="M2 17v-1a5 5 0 015-5h2a5 5 0 015 5v1" stroke="#15803d" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            }
          />
          <StatCard
            title="Đăng ký"
            value={totalRegistrations}
            icon={
              <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
                <path d="M6 2h8a2 2 0 012 2v14l-5-3-5 3V4a2 2 0 012-2z" stroke="#c2410c" strokeWidth="1.6" strokeLinejoin="round"/>
              </svg>
            }
          />
          <StatCard
            title="Check-in"
            value={totalCheckins}
            icon={
              <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
                <path d="M4 10l4 4 8-8" stroke="#7e22ce" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="10" cy="10" r="8" stroke="#7e22ce" strokeWidth="1.6"/>
              </svg>
            }
          />
        </div>

        {/* Charts */}
        <AttendanceChart
          attendanceRateData={attendanceRateData}
          registeredTotal={totalRegistrations}
          attendedTotal={totalCheckins}
        />

        {/* Table */}
        <div>
          <div className="db-section-title">Sự kiện gần đây</div>
          <DashboardEventTable rows={latestRows} />
        </div>
      </div>
    </>
  );
};

export default DashboardPage;