import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventApi, type Event } from '../api/eventApi';
import { attendanceApi } from '../api/attendanceApi';
import { usersApi } from '../api/usersApi';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import AttendanceChart, {
  type AttendanceRatePoint,
} from '../components/AttendanceChart';
import DashboardEventTable, {
  type DashboardEventRow,
} from '../components/DashboardEventTable';
import { PageError, PageLoading } from '../components/PageState';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
        const isOrganizer = user?.role === 'organizer';
        const [allEvents, usersRes] = await Promise.all([
          eventApi.getAllEvents(isOrganizer),
          isOrganizer ? Promise.resolve(null) : usersApi.listUsers({ page: 1, limit: 1 }),
        ]);

        setEvents(allEvents);
        setTotalStudents(usersRes?.data?.pagination?.total ?? 0);

        const sortedLatest = [...allEvents].sort(
          (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
        );

        // Use bulk stats API instead of looping individual calls
        const eventIds = allEvents.map((e) => e.id);
        const statsRes = await attendanceApi.getBulkEventStats(eventIds);
        const allStatsArray = statsRes.data?.data || statsRes.data || [];
        const statsMap = new Map();
        allStatsArray.forEach((item: any) => {
          statsMap.set(item.mongo_id || item.eventId, item);
        });

        const perEvent = allEvents.map((event) => {
          // Thử lookup bằng event.id, hoặc mongo_id nếu có
          const stats = statsMap.get(event.id) ?? statsMap.get((event as any).mongo_id);
          // Fallback về registration_count/attendance_count nhúng sẵn trong event nếu bulk stats miss
          const registered = Number(
            stats?.total_registered ?? (event as any).registration_count ?? 0
          );
          const attended = Number(
            stats?.total_attended ?? (event as any).attendance_count ?? 0
          );
          // Tính lại rate từ số thô và clamp 0-100 để tránh hiển thị sai
          const rate =
            registered > 0 ? Math.min(100, Math.round((attended / registered) * 100)) : 0;
          return { event, registered, attended, rate };
        });

        setTotalRegistrations(perEvent.reduce((sum, item) => sum + item.registered, 0));
        setTotalCheckins(perEvent.reduce((sum, item) => sum + item.attended, 0));

        const chartRows = [...perEvent]
          .filter((item) => item.registered > 0)
          .sort((a, b) => b.rate - a.rate || b.registered - a.registered)
          .slice(0, 8)
          .map((item) => ({
            name:
              item.event.title.length > 16
                ? `${item.event.title.slice(0, 16)}...`
                : item.event.title,
            attendance_rate: item.rate,
            registered: item.registered,
            attended: item.attended,
          }));

        setAttendanceRateData(
          chartRows.length > 0
            ? chartRows
            : perEvent.slice(0, 8).map((item) => ({
                name:
                  item.event.title.length > 16
                    ? `${item.event.title.slice(0, 16)}...`
                    : item.event.title,
                attendance_rate: item.rate,
                registered: item.registered,
                attended: item.attended,
              }))
        );

        const latest = sortedLatest.slice(0, 8);
        setLatestRows(
          latest.map((event) => {
            const stats = perEvent.find((item) => item.event.id === event.id);
            return {
              id: event.id,
              title: event.title,
              location: event.location,
              start_time: event.start_time,
              registered: stats?.registered || 0,
              checked_in: stats?.attended || 0,
            };
          })
        );
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Không thể tải dữ liệu tổng quan.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [user?.role]);

  const upcomingEvents = events.filter((event) => new Date(event.start_time) > now).length;

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
          margin-bottom: 12px; display: flex; align-items: center; gap: 8px;
        }
        .db-section-title::after {
          content: ''; flex: 1; height: 1px; background: #e8f2ff;
        }
      `}</style>

      <div className="db-root">
        <div className="db-header">
          <div className="db-title">Tổng quan</div>
          <div className="db-subtitle">Tổng quan sự kiện, đăng ký và điểm danh</div>
        </div>

        {error ? (
          <PageError message={error} />
        ) : loading ? (
          <PageLoading message="Đang tải dữ liệu tổng quan..." minHeight={320} />
        ) : (
          <>
            <div className="db-stats">
              <StatCard
                title="Tổng sự kiện"
                value={totalEvents}
                icon={
                  <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
                    <rect x="3" y="4" width="14" height="14" rx="2" stroke="#1d4ed8" strokeWidth="1.6" />
                    <path d="M13 2v4M7 2v4M3 8h14" stroke="#1d4ed8" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                }
                subtext={`${upcomingEvents} sắp diễn ra`}
                onClick={() => navigate('/events')}
              />
              <StatCard
                title="Sinh viên"
                value={totalStudents}
                icon={
                  <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
                    <circle cx="8" cy="6" r="3" stroke="#15803d" strokeWidth="1.6" />
                    <path d="M2 17v-1a5 5 0 015-5h2a5 5 0 015 5v1" stroke="#15803d" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                }
                onClick={() => navigate('/users')}
              />
              <StatCard
                title="Đăng ký"
                value={totalRegistrations}
                icon={
                  <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
                    <path d="M6 2h8a2 2 0 012 2v14l-5-3-5 3V4a2 2 0 012-2z" stroke="#c2410c" strokeWidth="1.6" strokeLinejoin="round" />
                  </svg>
                }
                onClick={() => navigate('/events')}
              />
              <StatCard
                title="Điểm danh"
                value={totalCheckins}
                icon={
                  <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
                    <path d="M4 10l4 4 8-8" stroke="#7e22ce" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="10" cy="10" r="8" stroke="#7e22ce" strokeWidth="1.6" />
                  </svg>
                }
                onClick={() => navigate('/attendance')}
              />
            </div>

            <AttendanceChart
              attendanceRateData={attendanceRateData}
              registeredTotal={totalRegistrations}
              attendedTotal={totalCheckins}
            />

            <div>
              <div className="db-section-title">Sự kiện gần đây</div>
              <DashboardEventTable rows={latestRows} />
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default DashboardPage;
