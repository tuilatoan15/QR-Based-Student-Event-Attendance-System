import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventApi, type Event } from '../api/eventApi';
import EventTable from '../components/EventTable';
import { useAuth } from '../context/AuthContext';

const EventsPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);
  const limit = 100;

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res =
        user?.role === 'organizer'
          ? await eventApi.getOrganizerEvents({ page, limit })
          : await eventApi.getEvents({ page, limit });

      const data = res.data.data ?? res.data;
      setEvents(Array.isArray(data) ? data : []);

      if (res.data.pagination) {
        setTotalPages(res.data.pagination.totalPages || 1);
        setTotalEvents(res.data.pagination.total || 0);
      } else {
        setTotalEvents(Array.isArray(data) ? data.length : 0);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải danh sách sự kiện.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadEvents(); }, [page]);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa sự kiện này không?')) return;
    try {
      await eventApi.deleteEvent(id);
      await loadEvents();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Xóa thất bại. Vui lòng thử lại.');
    }
  };

  return (
    <>
      <style>{`
        .ep-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;}
        .ep-title{font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-.5px;}
        .ep-subtitle{font-size:13px;color:#94a3b8;margin-top:3px;}
        .ep-add-btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;background:linear-gradient(135deg,#38bdf8,#0284c7);color:#fff;border-radius:9px;font-size:13.5px;font-weight:600;text-decoration:none;transition:all .15s;box-shadow:0 3px 12px rgba(14,165,233,.35);}
        .ep-add-btn:hover{opacity:.9;transform:translateY(-1px);box-shadow:0 5px 18px rgba(14,165,233,.45);}
        .ep-loading{display:flex;align-items:center;gap:10px;color:#94a3b8;font-size:13px;padding:48px 0;justify-content:center;}
        .ep-spin{width:20px;height:20px;border:2px solid #e0eeff;border-top-color:#0284c7;border-radius:50%;animation:ep-spin .7s linear infinite;}
        @keyframes ep-spin{to{transform:rotate(360deg)}}
        .ep-error{background:#fff1f2;border:1px solid #fecaca;border-radius:10px;padding:12px 16px;color:#be123c;font-size:13px;}
        .ep-count{font-size:12.5px;color:#64748b;background:#f0f7ff;border:1px solid #e0eeff;padding:5px 12px;border-radius:20px;}
        .ep-pagination{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:20px;}
        .ep-page-btn{padding:6px 14px;border:1px solid #e0eeff;background:#fff;color:#0f172a;border-radius:6px;font-size:13px;font-weight:500;cursor:pointer;transition:all .15s;}
        .ep-page-btn:hover:not(:disabled){background:#f8fbff;border-color:#bae6fd;}
        .ep-page-btn:disabled{opacity:0.5;cursor:not-allowed;background:#f8fafc;}
        .ep-page-active{background:#0284c7;color:#fff;border-color:#0284c7;}
        .ep-page-active:hover:not(:disabled){background:#0369a1;border-color:#0369a1;}
        .ep-page-info{font-size:13px;color:#64748b;margin:0 12px;}
      `}</style>

      <div>
        <div className="ep-header">
          <div>
            <div className="ep-title">Sự kiện</div>
            {!loading && !error && (
              <div className="ep-subtitle">{totalEvents} sự kiện{user?.role === 'organizer' ? ' của bạn' : ' trong hệ thống'}</div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {!loading && !error && (
              <span className="ep-count">{totalEvents} sự kiện</span>
            )}
            <Link to="/events/create" className="ep-add-btn">
              <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
                <circle cx="8" cy="8" r="7" stroke="white" strokeWidth="1.5" />
                <path d="M8 5v6M5 8h6" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Tạo sự kiện
            </Link>
          </div>
        </div>

        {loading && (
          <div className="ep-loading">
            <div className="ep-spin" />
            Đang tải danh sách sự kiện...
          </div>
        )}
        {error && <div className="ep-error">⚠️ {error}</div>}
        {!loading && !error && (
          <>
            <EventTable events={events} onDelete={handleDelete} />
            {totalPages > 1 && (
              <div className="ep-pagination">
                <button
                  className="ep-page-btn"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Trước
                </button>
                <div className="ep-page-info">Trang {page} / {totalPages}</div>
                <button
                  className="ep-page-btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default EventsPage;