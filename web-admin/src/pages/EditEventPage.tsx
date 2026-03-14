import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
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
      setLoading(true); setError(null);
      try {
        const res = await eventApi.getEvent(Number(id));
        setEvent((res.data.data ?? res.data) as Event);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Không thể tải thông tin sự kiện.');
      } finally { setLoading(false); }
    };
    void load();
  }, [id]);

  const handleSubmit: React.ComponentProps<typeof EventForm>['onSubmit'] = async (values) => {
    if (!id) return;
    await eventApi.updateEvent(Number(id), values as any);
    navigate('/events');
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: '#94a3b8', fontSize: 13 }}>
      <div style={{ width: 20, height: 20, border: '2px solid #e0eeff', borderTopColor: '#0284c7', borderRadius: '50%', animation: 'x-spin .7s linear infinite' }} />
      <style>{'@keyframes x-spin{to{transform:rotate(360deg)}}'}</style>
      Đang tải thông tin sự kiện...
    </div>
  );
  if (error) return <div style={{ background: '#fff1f2', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 18px', color: '#be123c', fontSize: 13 }}>⚠️ {error}</div>;
  if (!event) return <div style={{ fontSize: 13, color: '#94a3b8', padding: 40, textAlign: 'center' }}>Không tìm thấy sự kiện.</div>;

  return (
    <>
      <style>{`
        .eep-back{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;background:#f0f7ff;border:1px solid #e0eeff;border-radius:8px;font-size:13px;font-weight:500;color:#0284c7;text-decoration:none;transition:all .14s;margin-bottom:16px;}
        .eep-back:hover{background:#e0f2fe;color:#0369a1;}
        .eep-header{margin-bottom:24px;}
        .eep-title{font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-.5px;}
        .eep-subtitle{font-size:13px;color:#94a3b8;margin-top:3px;}
        .eep-card{background:#fff;border-radius:14px;border:1px solid #e0eeff;box-shadow:0 1px 4px rgba(14,165,233,.06),0 4px 16px rgba(14,165,233,.05);padding:28px;}
        .eep-event-meta{display:flex;align-items:center;gap:10px;margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid #f1f8ff;}
        .eep-event-icon{width:42px;height:42px;background:linear-gradient(135deg,#38bdf8,#0284c7);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .eep-event-name{font-weight:700;color:#0f172a;font-size:15px;}
        .eep-event-id{font-size:12px;color:#94a3b8;margin-top:2px;}
      `}</style>

      <div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <Link to="/events" className="eep-back">
            <svg viewBox="0 0 14 14" fill="none" width="13" height="13"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Danh sách sự kiện
          </Link>
          <Link to={`/events/${id}`} className="eep-back">
            <svg viewBox="0 0 14 14" fill="none" width="13" height="13"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" /><path d="M7 5v2.5l1.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Chi tiết sự kiện
          </Link>
        </div>

        <div className="eep-header">
          <div className="eep-title">Chỉnh sửa sự kiện</div>
          <div className="eep-subtitle">Cập nhật thông tin sự kiện #{id}</div>
        </div>

        <div className="eep-card">
          <div className="eep-event-meta">
            <div className="eep-event-icon">
              <svg viewBox="0 0 20 20" fill="none" width="20" height="20"><rect x="2" y="3" width="16" height="15" rx="2" stroke="white" strokeWidth="1.5" /><path d="M7 1v4M13 1v4M2 8h16" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </div>
            <div>
              <div className="eep-event-name">{event.title}</div>
              <div className="eep-event-id">ID: #{id} · {event.location}</div>
            </div>
          </div>
          <EventForm initial={event} onSubmit={handleSubmit} />
        </div>
      </div>
    </>
  );
};

export default EditEventPage;