import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { eventApi } from '../api/eventApi';
import { exportToCsv, exportToXlsx } from '../utils/exporters';
import { removeDiacritics } from '../utils/stringUtils';

type Registration = {
  id: number;
  registration_id?: number;
  student_name?: string;
  email?: string;
  student_code?: string;
  registration_status?: string;
  registered_at?: string;
  checkin_time?: string | null;
};

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  attended: { label: 'Đã check-in', bg: '#f0fdf4', color: '#15803d' },
  registered: { label: 'Đã đăng ký', bg: '#eff6ff', color: '#1d4ed8' },
  cancelled: { label: 'Đã huỷ', bg: '#fff1f2', color: '#be123c' },
};
const getStatus = (raw?: string) => STATUS_MAP[(raw ?? '').toLowerCase()] ?? { label: raw ?? '—', bg: '#f8fafc', color: '#64748b' };
const filterKey = (raw?: string) => {
  const s = (raw ?? '').toLowerCase();
  if (s === 'cancelled') return 'cancelled';
  if (s === 'attended' || s === 'checked_in') return 'attended';
  return 'registered';
};

const EventRegistrationsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'registered' | 'attended' | 'cancelled'>('all');

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true); setError(null);
      try {
        const res = await eventApi.getEventRegistrations(Number(id));
        const data = res.data.data ?? res.data;
        setRegistrations(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Không thể tải danh sách tham dự viên.');
      } finally { setLoading(false); }
    };
    void load();
  }, [id]);

  const filtered = useMemo(() => {
    const term = removeDiacritics(search.trim().toLowerCase());
    return registrations.filter(reg => {
      if (statusFilter !== 'all' && filterKey(reg.registration_status) !== statusFilter) return false;
      if (!term) return true;
      return removeDiacritics((reg.student_name ?? '').toLowerCase()).includes(term) || removeDiacritics((reg.email ?? '').toLowerCase()).includes(term) || removeDiacritics((reg.student_code ?? '').toLowerCase()).includes(term);
    });
  }, [registrations, search, statusFilter]);

  const counts = useMemo(() => ({
    all: registrations.length,
    attended: registrations.filter(r => filterKey(r.registration_status) === 'attended').length,
    registered: registrations.filter(r => filterKey(r.registration_status) === 'registered').length,
    cancelled: registrations.filter(r => filterKey(r.registration_status) === 'cancelled').length,
  }), [registrations]);

  const doExportCsv = () => {
    const h = ['Tên sinh viên', 'Email', 'Mã SV', 'Trạng thái', 'Ngày đăng ký', 'Giờ check-in'];
    exportToCsv(`event-${id}-participants.csv`, h, filtered.map(r => [r.student_name ?? '', r.email ?? '', r.student_code ?? '', r.registration_status ?? '', r.registered_at ?? '', r.checkin_time ?? '']));
  };
  const doExportXlsx = () => {
    const h = ['Tên sinh viên', 'Email', 'Mã SV', 'Trạng thái', 'Ngày đăng ký', 'Giờ check-in'];
    exportToXlsx(`event-${id}-participants.xlsx`, 'Participants', h, filtered.map(r => [r.student_name ?? '', r.email ?? '', r.student_code ?? '', r.registration_status ?? '', r.registered_at ?? '', r.checkin_time ?? '']));
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: '#94a3b8', fontSize: 13 }}><div style={{ width: 20, height: 20, border: '2px solid #e0eeff', borderTopColor: '#0284c7', borderRadius: '50%', animation: 'x-spin .7s linear infinite' }} /><style>{'@keyframes x-spin{to{transform:rotate(360deg)}}'}</style>Đang tải...</div>;
  if (error) return <div style={{ background: '#fff1f2', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 18px', color: '#be123c', fontSize: 13 }}>⚠️ {error}</div>;

  return (
    <>
      <style>{`
        .erp-back{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;background:#f0f7ff;border:1px solid #e0eeff;border-radius:8px;font-size:13px;font-weight:500;color:#0284c7;text-decoration:none;transition:all .14s;margin-bottom:16px;}
        .erp-back:hover{background:#e0f2fe;}
        .erp-header{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:14px;margin-bottom:20px;}
        .erp-title{font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-.5px;}
        .erp-subtitle{font-size:13px;color:#94a3b8;margin-top:3px;}
        .erp-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:inherit;transition:all .14s;}
        .erp-btn-csv{background:#f0f7ff;color:#0284c7;border:1px solid #e0eeff;}.erp-btn-csv:hover{background:#e0f2fe;}
        .erp-btn-xlsx{background:linear-gradient(135deg,#38bdf8,#0284c7);color:#fff;}.erp-btn-xlsx:hover{opacity:.9;}
        .erp-stats{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px;}
        .erp-stat{background:#fff;border:1.5px solid #e0eeff;border-radius:12px;padding:12px 18px;cursor:pointer;transition:all .14s;min-width:100px;}
        .erp-stat:hover{border-color:#bae6fd;background:#f8fbff;}
        .erp-stat.active{border-color:#0284c7;background:#eff6ff;box-shadow:0 0 0 3px rgba(14,165,233,.12);}
        .erp-sv{font-size:22px;font-weight:800;letter-spacing:-1px;}
        .erp-sl{font-size:11.5px;color:#94a3b8;font-weight:500;margin-top:2px;}
        .erp-filters{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-bottom:14px;}
        .erp-sw{position:relative;}
        .erp-si{position:absolute;left:12px;top:50%;transform:translateY(-50%);pointer-events:none;color:#94a3b8;}
        .erp-s{padding:9px 14px 9px 38px;background:#fff;border:1.5px solid #e2e8f0;border-radius:9px;font-size:13.5px;font-family:inherit;color:#0f172a;outline:none;min-width:240px;transition:border-color .15s,box-shadow .15s;}
        .erp-s:focus{border-color:#0ea5e9;box-shadow:0 0 0 3px rgba(14,165,233,.15);}
        .erp-s::placeholder{color:#cbd5e1;}
        .erp-c{font-size:12px;color:#64748b;background:#f0f7ff;border:1px solid #e0eeff;padding:5px 12px;border-radius:20px;}
        .erp-card{background:#fff;border-radius:14px;border:1px solid #e0eeff;box-shadow:0 1px 4px rgba(14,165,233,.06),0 4px 16px rgba(14,165,233,.05);overflow:hidden;}
        .erp-table{width:100%;border-collapse:collapse;font-size:13.5px;}
        .erp-table thead tr{background:#f8fbff;border-bottom:1px solid #e0eeff;}
        .erp-table thead th{padding:12px 18px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;white-space:nowrap;}
        .erp-table tbody tr{border-bottom:1px solid #f1f8ff;transition:background .12s;}
        .erp-table tbody tr:last-child{border-bottom:none;}
        .erp-table tbody tr:hover{background:#f8fbff;}
        .erp-table tbody td{padding:13px 18px;vertical-align:middle;}
        .erp-n{font-weight:600;color:#0f172a;font-size:13.5px;}
        .erp-e{font-size:13px;color:#64748b;}
        .erp-code{font-size:11px;background:#eff6ff;color:#1d4ed8;padding:2px 8px;border-radius:4px;display:inline-block;margin-top:3px;font-weight:600;}
        .erp-badge{display:inline-flex;align-items:center;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;}
        .erp-t{font-size:12.5px;color:#64748b;white-space:nowrap;}
        .erp-empty{padding:48px 16px;text-align:center;color:#94a3b8;font-size:13.5px;}
      `}</style>

      <div>
        <Link to={`/events/${id}`} className="erp-back">
          <svg viewBox="0 0 14 14" fill="none" width="13" height="13"><path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Quay lại chi tiết sự kiện
        </Link>

        <div className="erp-header">
          <div>
            <div className="erp-title">Tham dự viên</div>
            <div className="erp-subtitle">Sự kiện #{id} · {registrations.length} người đăng ký</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={doExportCsv} className="erp-btn erp-btn-csv">
              <svg viewBox="0 0 14 14" fill="none" width="12" height="12"><path d="M2 10v2h10v-2M7 2v7M4 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Xuất CSV
            </button>
            <button type="button" onClick={doExportXlsx} className="erp-btn erp-btn-xlsx">
              <svg viewBox="0 0 14 14" fill="none" width="12" height="12"><path d="M2 10v2h10v-2M7 2v7M4 7l3 3 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Xuất Excel
            </button>
          </div>
        </div>

        <div className="erp-stats">
          {([
            { key: 'all', label: 'Tất cả', val: counts.all, color: '#0f172a' },
            { key: 'registered', label: 'Đã đăng ký', val: counts.registered, color: '#1d4ed8' },
            { key: 'attended', label: 'Đã check-in', val: counts.attended, color: '#15803d' },
            { key: 'cancelled', label: 'Đã huỷ', val: counts.cancelled, color: '#be123c' },
          ] as const).map(s => (
            <div key={s.key} className={`erp-stat ${statusFilter === s.key ? 'active' : ''}`} onClick={() => setStatusFilter(s.key)}>
              <div className="erp-sv" style={{ color: s.color }}>{s.val}</div>
              <div className="erp-sl">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="erp-filters">
          <div className="erp-sw">
            <span className="erp-si"><svg viewBox="0 0 16 16" fill="none" width="14" height="14"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" /><path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></span>
            <input type="text" placeholder="Tìm tên, email, mã sinh viên..." className="erp-s" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span className="erp-c">{filtered.length} kết quả</span>
        </div>

        <div className="erp-card">
          <div style={{ overflowX: 'auto' }}>
            <table className="erp-table">
              <thead><tr>
                <th>Sinh viên</th><th>Email</th><th>Ngày đăng ký</th><th>Trạng thái</th><th>Giờ check-in</th>
              </tr></thead>
              <tbody>
                {filtered.map(reg => {
                  const st = getStatus(reg.registration_status);
                  return (
                    <tr key={reg.registration_id ?? reg.id}>
                      <td><div className="erp-n">{reg.student_name ?? '—'}</div>{reg.student_code && <span className="erp-code">{reg.student_code}</span>}</td>
                      <td><div className="erp-e">{reg.email ?? '—'}</div></td>
                      <td><span className="erp-t">{reg.registered_at ? new Date(reg.registered_at).toLocaleString('vi-VN') : '—'}</span></td>
                      <td><span className="erp-badge" style={{ background: st.bg, color: st.color }}>{st.label}</span></td>
                      <td><span className="erp-t">{reg.checkin_time ? new Date(reg.checkin_time).toLocaleString('vi-VN') : '—'}</span></td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && <tr><td colSpan={5} className="erp-empty"><div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>Không có tham dự viên nào</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default EventRegistrationsPage;