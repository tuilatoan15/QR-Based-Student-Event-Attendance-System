import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { eventApi, type Event } from '../api/eventApi';
import { useAuth } from '../context/AuthContext';
import EventTable from '../components/EventTable';

const EventsPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEvents, setTotalEvents] = useState(0);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const isOrg = user?.role === 'organizer';
      const params = { page, limit: 10, search };
      const res = isOrg 
        ? await eventApi.getOrganizerEvents(params)
        : await eventApi.getEvents(params);
      
      const resBody = res.data;
      const eventsList = resBody.data;
      const pag = resBody.pagination || {};

      setEvents(Array.isArray(eventsList) ? eventsList : []);
      setTotalPages(pag.totalPages || 1);
      setTotalEvents(pag.total || 0);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải danh sách sự kiện.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, [page, user]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sự kiện này?')) return;
    try {
      await eventApi.deleteEvent(id);
      void loadEvents();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Xóa thất bại.');
    }
  };

  return (
    <>
      <style>{`
        .ep-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:16px;}
        .ep-title{font-size:24px;font-weight:800;color:#0f172a;letter-spacing:-.5px;}
        .ep-subtitle{font-size:13px;color:#94a3b8;margin-top:2px;}
        .ep-add-btn{display:inline-flex;align-items:center;gap:8px;padding:11px 20px;background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#fff;border-radius:10px;font-size:14px;font-weight:600;text-decoration:none;transition:all .15s;box-shadow:0 4px 12px rgba(14,165,233,.35);}
        .ep-add-btn:hover{transform:translateY(-1px);box-shadow:0 6px 16px rgba(14,165,233,.45);opacity:.95;}
        .ep-loading{display:flex;align-items:center;justify-content:center;height:240px;gap:12px;color:#94a3b8;font-size:14px;}
        .ep-error{padding:16px;background:#fff1f2;border:1px solid #fecaca;border-radius:12px;color:#be123c;font-size:14px;}
        .ep-spin{width:18px;height:18px;border:2px solid #e0eeff;border-top-color:#0284c7;border-radius:50%;animation:ep-spin .7s linear infinite;}
        @keyframes ep-spin{to{transform:rotate(360deg)}}
        .ep-pagination{display:flex;align-items:center;justify-content:center;margin-top:28px;}
        .ep-page-btn{padding:7px 14px;background:#fff;border:1px solid #e2e8f0;border-radius:7px;color:#475569;font-size:12.5px;font-weight:600;cursor:pointer;transition:all .14s;}
        .ep-page-btn:hover:not(:disabled){background:#f8fbff;border-color:#0284c7;color:#0284c7;}
        .ep-page-btn:disabled{opacity:.5;cursor:not-allowed;}
        .ep-page-info{font-size:13px;color:#64748b;margin:0 12px;}
        .ep-search-btn{padding:9px 18px;background:linear-gradient(135deg,#38bdf8,#0284c7);color:#fff;border-radius:9px;font-size:13.5px;font-weight:600;border:none;cursor:pointer;transition:all .15s;font-family:inherit;box-shadow:0 2px 8px rgba(14,165,233,.3);}
        .ep-search-btn:hover{opacity:.9;transform:translateY(-1px);}
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
            <div style={{ position: 'relative' }}>
              <input type="text" placeholder="Tìm sự kiện, địa điểm..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} onKeyDown={(e) => { if(e.key === 'Enter') void loadEvents(); }} style={{ padding: '9px 14px 9px 36px', borderRadius: '9px', border: '1px solid #e0eeff', outline: 'none', fontSize: '13.5px', width: '240px', color: '#0f172a' }} />
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="#94a3b8" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </div>
            <button className="ep-search-btn" onClick={() => void loadEvents()}>Tìm kiếm</button>
            <Link to="/events/create" className="ep-add-btn">
              <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
                <circle cx="8" cy="8" r="7" stroke="white" strokeWidth="1.5" />
                <path d="M8 5v6M5 8h6" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Tạo sự kiện
            </Link>
          </div>
        </div>

        {loading && events.length === 0 && (
          <div className="ep-loading">
            <div className="ep-spin" />
            Đang tải danh sách...
          </div>
        )}
        {error && <div className="ep-error">⚠️ {error}</div>}
        {!error && (
          <div style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s', pointerEvents: loading ? 'none' : 'auto' }}>
            {events.length === 0 && !loading && (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>Không tìm thấy sự kiện nào.</div>
            )}
            {events.length > 0 && (
              <EventTable events={events} onDelete={handleDelete} />
            )}
            {totalPages > 1 && events.length > 0 && (
              <div className="ep-pagination">
                <button className="ep-page-btn" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Trước</button>
                <div className="ep-page-info">Trang {page} / {totalPages}</div>
                <button className="ep-page-btn" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Sau</button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default EventsPage;