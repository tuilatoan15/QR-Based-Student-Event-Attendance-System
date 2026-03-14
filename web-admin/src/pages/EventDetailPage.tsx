import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { eventApi, type Event } from '../api/eventApi';
import { exportToCsv, exportToXlsx } from '../utils/exporters';

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  attended: { label: 'Đã check-in', bg: '#f0fdf4', color: '#15803d' },
  registered: { label: 'Đã đăng ký', bg: '#eff6ff', color: '#1d4ed8' },
  cancelled: { label: 'Đã huỷ', bg: '#fff1f2', color: '#be123c' },
};
const getStatus = (raw?: string) => STATUS_MAP[(raw ?? '').toLowerCase()] ?? { label: raw ?? '—', bg: '#f8fafc', color: '#64748b' };

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true); setError(null);
      try {
        const [evRes, partRes] = await Promise.all([
          eventApi.getEvent(Number(id)),
          eventApi.getEventRegistrations(Number(id)),
        ]);
        setEvent((evRes.data.data ?? evRes.data) as Event);
        const pd = partRes.data.data ?? partRes.data;
        setParticipants(Array.isArray(pd) ? pd : []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Không thể tải chi tiết sự kiện.');
      } finally { setLoading(false); }
    };
    void load();
  }, [id]);

  const stats = useMemo(() => {
    const total = participants.length;
    const attended = participants.filter(p => (p.registration_status ?? '').toLowerCase() === 'attended' || !!p.checkin_time).length;
    const cancelled = participants.filter(p => (p.registration_status ?? '').toLowerCase() === 'cancelled').length;
    const pct = total > 0 ? Math.round(attended / total * 100) : 0;
    return { total, attended, cancelled, pct };
  }, [participants]);

  const doExportCsv = () => {
    const h = ['Reg ID', 'Tên sinh viên', 'Email', 'Mã SV', 'Trạng thái', 'Giờ check-in'];
    exportToCsv(`event-${id}-participants.csv`, h, participants.map(p => [p.registration_id ?? '', p.student_name ?? '', p.email ?? '', p.student_code ?? '', p.registration_status ?? '', p.checkin_time ? new Date(p.checkin_time).toLocaleString('vi-VN') : '']));
  };
  const doExportXlsx = () => {
    const h = ['Reg ID', 'Tên sinh viên', 'Email', 'Mã SV', 'Trạng thái', 'Giờ check-in'];
    exportToXlsx(`event-${id}-participants.xlsx`, 'Participants', h, participants.map(p => [p.registration_id ?? '', p.student_name ?? '', p.email ?? '', p.student_code ?? '', p.registration_status ?? '', p.checkin_time ? new Date(p.checkin_time).toLocaleString('vi-VN') : '']));
  };

  const now = new Date();
  const getEventStatus = (ev: Event) => {
    const s = new Date(ev.start_time), e = new Date(ev.end_time);
    if (now < s) return { label: 'Sắp diễn ra', bg: '#eff6ff', color: '#1d4ed8' };
    if (now > e) return { label: 'Đã kết thúc', bg: '#f8fafc', color: '#64748b' };
    return { label: 'Đang diễn ra', bg: '#f0fdf4', color: '#15803d' };
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: '#94a3b8', fontSize: 13 }}>
      <div style={{ width: 20, height: 20, border: '2px solid #e0eeff', borderTopColor: '#0284c7', borderRadius: '50%', animation: 'x-spin .7s linear infinite' }} />
      <style>{'@keyframes x-spin{to{transform:rotate(360deg)}}'}</style>
      Đang tải chi tiết sự kiện...
    </div>
  );
  if (error) return <div style={{ background: '#fff1f2', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 18px', color: '#be123c', fontSize: 13 }}>⚠️ {error}</div>;
  if (!event) return <div style={{ fontSize: 13, color: '#94a3b8', padding: 40, textAlign: 'center' }}>Không tìm thấy sự kiện.</div>;

  const evStatus = getEventStatus(event);

  return (
    <>
      <style>{`
        .edp-back{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;background:#f0f7ff;border:1px solid #e0eeff;border-radius:8px;font-size:13px;font-weight:500;color:#0284c7;text-decoration:none;transition:all .14s;margin-bottom:16px;}
        .edp-back:hover{background:#e0f2fe;color:#0369a1;}

        .edp-hero{background:linear-gradient(135deg,#0ea5e9 0%,#0284c7 50%,#0369a1 100%);border-radius:16px;padding:28px 28px 24px;margin-bottom:20px;position:relative;overflow:hidden;}
        .edp-hero::before{content:'';position:absolute;top:-40px;right:-40px;width:200px;height:200px;background:rgba(255,255,255,.07);border-radius:50%;}
        .edp-hero::after{content:'';position:absolute;bottom:-60px;right:60px;width:140px;height:140px;background:rgba(255,255,255,.05);border-radius:50%;}
        .edp-hero-top{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:14px;margin-bottom:18px;}
        .edp-hero-title{font-size:24px;font-weight:800;color:#fff;letter-spacing:-.5px;max-width:560px;line-height:1.25;}
        .edp-hero-status{display:inline-flex;align-items:center;padding:5px 12px;border-radius:20px;font-size:12.5px;font-weight:600;background:rgba(255,255,255,.2);color:#fff;border:1px solid rgba(255,255,255,.3);}
        .edp-hero-actions{display:flex;gap:8px;flex-wrap:wrap;}
        .edp-ha{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:9px;font-size:13px;font-weight:600;text-decoration:none;transition:all .14s;border:none;cursor:pointer;font-family:inherit;}
        .edp-ha-edit{background:#fff;color:#0284c7;}.edp-ha-edit:hover{background:#f0f7ff;}
        .edp-ha-parts{background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.3);}.edp-ha-parts:hover{background:rgba(255,255,255,.25);}
        .edp-ha-scan{background:#22c55e;color:#fff;}.edp-ha-scan:hover{background:#16a34a;}
        .edp-meta-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;}
        .edp-meta-item{background:rgba(255,255,255,.12);border-radius:10px;padding:12px 14px;}
        .edp-meta-lbl{font-size:11px;color:rgba(255,255,255,.65);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px;}
        .edp-meta-val{font-size:14px;font-weight:600;color:#fff;}

        .edp-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;}
        @media(max-width:700px){.edp-stats{grid-template-columns:repeat(2,1fr);}}
        .edp-stat{background:#fff;border-radius:12px;border:1px solid #e0eeff;padding:16px 18px;box-shadow:0 1px 4px rgba(14,165,233,.06);}
        .edp-stat-v{font-size:26px;font-weight:800;letter-spacing:-1.5px;color:#0f172a;}
        .edp-stat-l{font-size:12px;color:#94a3b8;font-weight:500;margin-top:3px;}
        .edp-stat-bar{margin-top:10px;height:4px;background:#f0f7ff;border-radius:2px;overflow:hidden;}
        .edp-stat-fill{height:100%;border-radius:2px;background:linear-gradient(90deg,#38bdf8,#0284c7);transition:width .4s;}

        .edp-desc-card{background:#fff;border-radius:14px;border:1px solid #e0eeff;padding:22px 24px;margin-bottom:20px;box-shadow:0 1px 4px rgba(14,165,233,.06);}
        .edp-section-title{font-size:14px;font-weight:700;color:#0f172a;margin-bottom:12px;display:flex;align-items:center;gap:8px;}
        .edp-section-title::after{content:'';flex:1;height:1px;background:#f0f7ff;}
        .edp-desc-text{font-size:13.5px;color:#475569;line-height:1.6;}

        .edp-part-card{background:#fff;border-radius:14px;border:1px solid #e0eeff;overflow:hidden;box-shadow:0 1px 4px rgba(14,165,233,.06);}
        .edp-part-head{padding:16px 20px;border-bottom:1px solid #f1f8ff;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;}
        .edp-part-title{font-size:14px;font-weight:700;color:#0f172a;}
        .edp-part-actions{display:flex;gap:8px;flex-wrap:wrap;}
        .edp-pa{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:8px;font-size:12.5px;font-weight:600;text-decoration:none;border:none;cursor:pointer;font-family:inherit;transition:all .14s;}
        .edp-pa-csv{background:#f0f7ff;color:#0284c7;border:1px solid #e0eeff;}.edp-pa-csv:hover{background:#e0f2fe;}
        .edp-pa-xlsx{background:linear-gradient(135deg,#38bdf8,#0284c7);color:#fff;}.edp-pa-xlsx:hover{opacity:.9;}
        .edp-pa-scan{background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;}.edp-pa-scan:hover{background:#dcfce7;}
        .edp-pa-all{background:#f8fafc;color:#334155;border:1px solid #e2e8f0;}.edp-pa-all:hover{background:#f0f7ff;}

        .edp-table{width:100%;border-collapse:collapse;font-size:13.5px;}
        .edp-table thead tr{background:#f8fbff;border-bottom:1px solid #e0eeff;}
        .edp-table thead th{padding:12px 18px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;white-space:nowrap;}
        .edp-table tbody tr{border-bottom:1px solid #f1f8ff;transition:background .12s;}
        .edp-table tbody tr:last-child{border-bottom:none;}
        .edp-table tbody tr:hover{background:#f8fbff;}
        .edp-table tbody td{padding:13px 18px;vertical-align:middle;}
        .edp-pname{font-weight:600;color:#0f172a;font-size:13.5px;}
        .edp-pemail{font-size:12px;color:#94a3b8;margin-top:1px;}
        .edp-pcode{font-size:11px;background:#eff6ff;color:#1d4ed8;padding:2px 8px;border-radius:4px;display:inline-block;margin-top:3px;font-weight:600;}
        .edp-badge{display:inline-flex;align-items:center;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;}
        .edp-time{font-size:12.5px;color:#64748b;white-space:nowrap;}
        .edp-empty{padding:48px 16px;text-align:center;color:#94a3b8;font-size:13.5px;}
      `}</style>

      <div>
        <Link to="/events" className="edp-back">
          <svg viewBox="0 0 14 14" fill="none" width="13" height="13"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Danh sách sự kiện
        </Link>

        {/* Hero card */}
        <div className="edp-hero">
          <div className="edp-hero-top">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,.6)', background: 'rgba(255,255,255,.12)', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>#{event.id}</span>
                <span className="edp-hero-status">{evStatus.label}</span>
              </div>
              <div className="edp-hero-title">{event.title}</div>
            </div>
            <div className="edp-hero-actions">
              <Link to={`/events/${event.id}/edit`} className="edp-ha edp-ha-edit">
                <svg viewBox="0 0 14 14" fill="none" width="12" height="12"><path d="M9 2l3 3L4 13H1v-3L9 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>
                Sửa
              </Link>
              <Link to={`/events/${event.id}/participants`} className="edp-ha edp-ha-parts">
                <svg viewBox="0 0 14 14" fill="none" width="12" height="12"><circle cx="5" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.3" /><path d="M1 12v-1a4 4 0 014-4h0a4 4 0 014 4v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                Tham dự viên
              </Link>
              <Link to={`/qr-scanner?eventId=${event.id}`} className="edp-ha edp-ha-scan">
                <svg viewBox="0 0 14 14" fill="none" width="12" height="12"><path d="M1 4V2.5A1.5 1.5 0 012.5 1H4M10 1h1.5A1.5 1.5 0 0113 2.5V4M13 10v1.5A1.5 1.5 0 0111.5 13H10M4 13H2.5A1.5 1.5 0 011 11.5V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /><rect x="3.5" y="3.5" width="3" height="3" rx=".5" stroke="currentColor" strokeWidth="1.2" /><rect x="7.5" y="7.5" width="3" height="3" rx=".5" stroke="currentColor" strokeWidth="1.2" /></svg>
                Quét QR
              </Link>
            </div>
          </div>
          <div className="edp-meta-grid">
            <div className="edp-meta-item">
              <div className="edp-meta-lbl">📍 Địa điểm</div>
              <div className="edp-meta-val">{event.location}</div>
            </div>
            <div className="edp-meta-item">
              <div className="edp-meta-lbl">📅 Bắt đầu</div>
              <div className="edp-meta-val">{new Date(event.start_time).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            <div className="edp-meta-item">
              <div className="edp-meta-lbl">⏰ Kết thúc</div>
              <div className="edp-meta-val">{new Date(event.end_time).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
            </div>
            <div className="edp-meta-item">
              <div className="edp-meta-lbl">👥 Sức chứa</div>
              <div className="edp-meta-val">{event.max_participants} người</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="edp-stats">
          <div className="edp-stat">
            <div className="edp-stat-v">{stats.total}</div>
            <div className="edp-stat-l">Đã đăng ký</div>
            <div className="edp-stat-bar"><div className="edp-stat-fill" style={{ width: `${event.max_participants > 0 ? Math.min(100, Math.round(stats.total / event.max_participants * 100)) : 0}%` }} /></div>
          </div>
          <div className="edp-stat">
            <div className="edp-stat-v" style={{ color: '#15803d' }}>{stats.attended}</div>
            <div className="edp-stat-l">Đã check-in</div>
            <div className="edp-stat-bar"><div className="edp-stat-fill" style={{ width: `${stats.pct}%`, background: 'linear-gradient(90deg,#4ade80,#22c55e)' }} /></div>
          </div>
          <div className="edp-stat">
            <div className="edp-stat-v" style={{ color: '#be123c' }}>{stats.cancelled}</div>
            <div className="edp-stat-l">Đã huỷ</div>
          </div>
          <div className="edp-stat">
            <div className="edp-stat-v" style={{ color: '#0284c7' }}>{stats.pct}%</div>
            <div className="edp-stat-l">Tỷ lệ tham dự</div>
            <div className="edp-stat-bar"><div className="edp-stat-fill" style={{ width: `${stats.pct}%` }} /></div>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div className="edp-desc-card">
            <div className="edp-section-title">Mô tả</div>
            <div className="edp-desc-text">{event.description}</div>
          </div>
        )}

        {/* Participants table */}
        <div className="edp-part-card">
          <div className="edp-part-head">
            <div>
              <div className="edp-part-title">Danh sách tham dự viên</div>
              <div style={{ fontSize: 12.5, color: '#94a3b8', marginTop: 3 }}>
                {stats.total} đăng ký · {stats.attended} check-in · {stats.cancelled} huỷ
              </div>
            </div>
            <div className="edp-part-actions">
              <button type="button" onClick={doExportCsv} className="edp-pa edp-pa-csv">
                <svg viewBox="0 0 14 14" fill="none" width="11" height="11"><path d="M2 10v2h10v-2M7 2v7M4 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                CSV
              </button>
              <button type="button" onClick={doExportXlsx} className="edp-pa edp-pa-xlsx">
                <svg viewBox="0 0 14 14" fill="none" width="11" height="11"><path d="M2 10v2h10v-2M7 2v7M4 7l3 3 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Excel
              </button>
              <Link to={`/qr-scanner?eventId=${event.id}`} className="edp-pa edp-pa-scan">
                <svg viewBox="0 0 14 14" fill="none" width="11" height="11"><path d="M1 4V2.5A1.5 1.5 0 012.5 1H4M10 1h1.5A1.5 1.5 0 0113 2.5V4M13 10v1.5A1.5 1.5 0 0111.5 13H10M4 13H2.5A1.5 1.5 0 011 11.5V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                Mở Scanner
              </Link>
              <Link to={`/events/${event.id}/participants`} className="edp-pa edp-pa-all">
                Xem tất cả →
              </Link>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="edp-table">
              <thead><tr>
                <th>Sinh viên</th><th>Email</th><th>Trạng thái</th><th>Giờ check-in</th>
              </tr></thead>
              <tbody>
                {participants.slice(0, 20).map((p, idx) => {
                  const st = getStatus(p.registration_status);
                  return (
                    <tr key={p.registration_id ?? idx}>
                      <td>
                        <div className="edp-pname">{p.student_name ?? '—'}</div>
                        {p.student_code && <span className="edp-pcode">{p.student_code}</span>}
                      </td>
                      <td><div className="edp-pemail">{p.email ?? '—'}</div></td>
                      <td><span className="edp-badge" style={{ background: st.bg, color: st.color }}>{st.label}</span></td>
                      <td><span className="edp-time">{p.checkin_time ? new Date(p.checkin_time).toLocaleString('vi-VN') : '—'}</span></td>
                    </tr>
                  );
                })}
                {participants.length === 0 && <tr><td colSpan={4} className="edp-empty"><div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>Chưa có tham dự viên</td></tr>}
                {participants.length > 20 && (
                  <tr><td colSpan={4} style={{ padding: '12px 18px', textAlign: 'center' }}>
                    <Link to={`/events/${event.id}/participants`} style={{ color: '#0284c7', fontSize: 13, fontWeight: 600 }}>Xem tất cả {participants.length} tham dự viên →</Link>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default EventDetailPage;