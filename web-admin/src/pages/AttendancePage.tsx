import React, { useEffect, useMemo, useState } from 'react';
import { QrReader } from 'react-qr-reader';
import { attendanceApi, type AttendanceListRecord } from '../api/attendanceApi';
import { eventApi, type Event } from '../api/eventApi';
import { exportToCsv, exportToXlsx } from '../utils/exporters';
import { notifySuccess } from '../utils/notify';
import { useAuth } from '../context/AuthContext';
import { removeDiacritics } from '../utils/stringUtils';

type ScanResult = { at: string; ok: boolean; message: string; };

const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [records, setRecords] = useState<AttendanceListRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventId, setEventId] = useState<string | 'all'>('all');
  const [search, setSearch] = useState('');
  // Manual check-in by student code
  const [manualStudentCode, setManualStudentCode] = useState('');
  const [manualEventId, setManualEventId] = useState<string>('');
  const [manualResult, setManualResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [manualLoading, setManualLoading] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [scanning, setScanning] = useState(false);
  const [processingScan, setProcessingScan] = useState(false);

  const reload = async (eid: string | 'all' = eventId, q: string = search) => {
    setLoading(true);
    try {
      const res = await attendanceApi.listAttendance({
        event_id: eid === 'all' ? undefined : eid,
        search: q.trim() ? q.trim() : undefined,
      });
      const data = res.data?.data ?? res.data;
      setRecords(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  };

  // Load events list on mount, then load records with default filter
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const isOrg = user?.role === 'organizer';
        const evsRes = await eventApi.getAllEvents(isOrg);
        setEvents(Array.isArray(evsRes) ? evsRes : []);
        // Load default records (all events = checked-in only)
        await reload('all', '');
      } finally { setLoading(false); }
    };
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload when eventId changes — pass new value directly to avoid stale closure
  useEffect(() => {
    void reload(eventId, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const filtered = useMemo(() => {
    const term = removeDiacritics(search.trim().toLowerCase());
    return records.filter((r) => {
      if (!term) return true;
      return (
        removeDiacritics((r.student_name ?? '').toLowerCase()).includes(term) ||
        removeDiacritics((r.email ?? '').toLowerCase()).includes(term) ||
        removeDiacritics((r.student_code ?? '').toLowerCase()).includes(term) ||
        removeDiacritics((r.event_title ?? '').toLowerCase()).includes(term)
      );
    });
  }, [records, search]);

  const onManualCheckin = async () => {
    const code = manualStudentCode.trim();
    const eid = manualEventId;
    if (!code) { setManualResult({ ok: false, msg: 'Vui lòng nhập mã số sinh viên' }); return; }
    if (!eid) { setManualResult({ ok: false, msg: 'Vui lòng chọn sự kiện' }); return; }
    setManualLoading(true);
    setManualResult(null);
    try {
      const res = await attendanceApi.manualCheckinByStudent(code, eid);
      const data = res.data?.data;
      const alreadyDone = data?.already_checked_in === true;
      const studentName = data?.student_name || '';
      const checkinTime = data?.check_in_time;

      if (alreadyDone) {
        await reload(eventId, search);
        return;
      }

      let displayMsg = res.data?.message || 'Điểm danh thành công';

      if (studentName) {
        displayMsg = `${studentName} - ${displayMsg}`;
      }

      if (checkinTime) {
        const timeStr = new Date(checkinTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        displayMsg += ` (${timeStr})`;
      }

      setManualResult({ ok: true, msg: '✓ ' + displayMsg });
      setManualStudentCode('');
      notifySuccess(displayMsg);
      await reload(eventId, search);
    } catch (err: any) {
      const m = err?.response?.data?.message || 'Điểm danh thất bại';
      setManualResult({ ok: false, msg: '✗ ' + m });
    } finally { setManualLoading(false); }
  };

  const onExportCsv = () => {
    const header = ['Tên sinh viên', 'Email', 'Mã SV', 'Sự kiện', 'Giờ điểm danh'];
    const rows = filtered.map((r) => {
      const time = r.check_in_time || (r as any).checkin_time || (r as any).checkInTime || (r as any).CHECK_IN_TIME || (r.registration_status === 'attended' ? r.registered_at : null);
      return [r.student_name, r.email, r.student_code ?? '', r.event_title, time ? new Date(time).toLocaleString('vi-VN') : ''];
    });
    exportToCsv('attendance-report.csv', header, rows);
  };

  const onExportXlsx = () => {
    const header = ['Tên sinh viên', 'Email', 'Mã SV', 'Sự kiện', 'Giờ điểm danh'];
    const rows = filtered.map((r) => {
      const time = r.check_in_time || (r as any).checkin_time || (r as any).checkInTime || (r as any).CHECK_IN_TIME || (r.registration_status === 'attended' ? r.registered_at : null);
      return [r.student_name, r.email, r.student_code ?? '', r.event_title, time ? new Date(time).toLocaleString('vi-VN') : ''];
    });
    exportToXlsx('attendance-report.xlsx', 'Attendance', header, rows);
  };

  const handleScan = async (text: string) => {
    if (processingScan) return;
    setProcessingScan(true);
    try {
      const res = await attendanceApi.checkIn(text);
      const data = res.data?.data;
      const alreadyDone = data?.already_checked_in === true;
      const studentName = data?.student_name || '';

      if (alreadyDone) {
        await reload(eventId, search);
        return;
      }

      let displayMsg = res.data?.message || 'Điểm danh thành công';

      if (studentName) {
        displayMsg = `${studentName}: ${displayMsg}`;
      }

      setScanResults(prev => {
        return [{ at: new Date().toISOString(), ok: true, message: displayMsg }, ...prev].slice(0, 8);
      });

      notifySuccess(displayMsg);
      await reload(eventId, search);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Điểm danh thất bại. Kiểm tra lại mã QR.';
      setScanResults(prev => [{ at: new Date().toISOString(), ok: false, message: msg }, ...prev].slice(0, 8));
    } finally { setProcessingScan(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: '#94a3b8', fontSize: 13 }}>
      <div style={{ width: 20, height: 20, border: '2px solid #e0eeff', borderTopColor: '#0284c7', borderRadius: '50%', animation: 'att-spin .7s linear infinite' }} />
      <style>{`@keyframes att-spin{to{transform:rotate(360deg)}}`}</style>
      Đang tải dữ liệu điểm danh...
    </div>
  );

  return (
    <>
      <style>{`
        .att-header{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:22px;}
        .att-title{font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-.5px;}
        .att-subtitle{font-size:13px;color:#94a3b8;margin-top:3px;}
        .att-export-row{display:flex;gap:8px;flex-wrap:wrap;}
        .att-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;font-family:inherit;transition:all .14s;text-decoration:none;}
        .att-btn-csv{background:#f0f7ff;color:#0284c7;border:1px solid #e0eeff;}.att-btn-csv:hover{background:#e0f2fe;}
        .att-btn-xlsx{background:linear-gradient(135deg,#38bdf8,#0284c7);color:#fff;box-shadow:0 2px 8px rgba(14,165,233,.3);}.att-btn-xlsx:hover{opacity:.9;}

        .att-layout{display:grid;grid-template-columns:1fr 320px;gap:16px;}
        @media(max-width:900px){.att-layout{grid-template-columns:1fr;}}

        .att-card{background:#fff;border-radius:14px;border:1px solid #e0eeff;box-shadow:0 1px 4px rgba(14,165,233,.06),0 4px 16px rgba(14,165,233,.05);overflow:hidden;}
        .att-card-head{padding:14px 18px;border-bottom:1px solid #f1f8ff;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;}
        .att-card-title{font-size:13.5px;font-weight:700;color:#0f172a;}
        .att-card-body{padding:16px 18px;}

        .att-filters{display:flex;align-items:center;gap:9px;flex-wrap:wrap;}
        .att-select,.att-search-input{padding:8px 12px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:inherit;color:#0f172a;outline:none;transition:border-color .15s,box-shadow .15s;}
        .att-select:focus,.att-search-input:focus{border-color:#0ea5e9;box-shadow:0 0 0 3px rgba(14,165,233,.15);background:#fff;}
        .att-search-input{min-width:200px;}
        .att-apply-btn{padding:8px 16px;background:#0284c7;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .14s;}
        .att-apply-btn:hover{background:#0369a1;}

        .att-table{width:100%;border-collapse:collapse;font-size:13.5px;}
        .att-table thead tr{background:#f8fbff;border-bottom:1px solid #e0eeff;}
        .att-table thead th{padding:11px 16px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;}
        .att-table tbody tr{border-bottom:1px solid #f1f8ff;transition:background .12s;}
        .att-table tbody tr:last-child{border-bottom:none;}
        .att-table tbody tr:hover{background:#f8fbff;}
        .att-table tbody td{padding:12px 16px;color:#334155;vertical-align:middle;}
        .att-student-name{font-weight:600;color:#0f172a;font-size:13.5px;}
        .att-student-email{font-size:11.5px;color:#94a3b8;margin-top:2px;}
        .att-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11.5px;font-weight:600;}
        .att-badge-attended{background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0;}
        .att-badge-cancelled{background:#fef2f2;color:#ef4444;border:1px solid #fee2e2;}
        .att-badge-reg{background:#fafafa;color:#64748b;border:1px solid #e2e8f0;}
        .att-empty{padding:40px 16px;text-align:center;color:#94a3b8;font-size:13px;}
        .att-count-badge{font-size:12px;color:#64748b;background:#f0f7ff;border:1px solid #e0eeff;padding:4px 10px;border-radius:20px;}
        .att-count-attended{font-size:12px;color:#15803d;background:#f0fdf4;border:1px solid #bbf7d0;padding:4px 10px;border-radius:20px;margin-left:6px;}

        .att-manual-input{display:flex;gap:8px;}
        .att-manual-text{flex:1;padding:9px 12px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:inherit;color:#0f172a;outline:none;transition:border-color .15s;}
        .att-manual-text:focus{border-color:#0ea5e9;box-shadow:0 0 0 3px rgba(14,165,233,.15);background:#fff;}
        .att-checkin-btn{padding:9px 14px;background:#22c55e;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .14s;white-space:nowrap;}
        .att-checkin-btn:hover{background:#16a34a;}

        .att-scan-toggle{padding:5px 12px;background:#f0f7ff;border:1px solid #e0eeff;border-radius:7px;font-size:12px;font-weight:600;color:#0284c7;cursor:pointer;font-family:inherit;transition:all .14s;}
        .att-scan-toggle:hover{background:#e0f2fe;}
        .att-scan-toggle.stop{background:#fff1f2;border-color:#fecaca;color:#be123c;}
        .att-scan-toggle.stop:hover{background:#ffe4e6;}

        .att-scan-result{border-radius:9px;padding:10px 13px;margin-bottom:7px;}
        .att-scan-result.ok{background:#f0fdf4;border:1px solid #bbf7d0;}
        .att-scan-result.fail{background:#fff1f2;border:1px solid #fecaca;}
        .att-scan-msg{font-size:13px;font-weight:600;}
        .att-scan-msg.ok{color:#15803d;}
        .att-scan-msg.fail{color:#be123c;}
        .att-scan-time{font-size:11px;color:#94a3b8;margin-top:2px;}
        .att-scan-empty{font-size:13px;color:#94a3b8;text-align:center;padding:16px 0;}
        .att-processing{display:flex;align-items:center;gap:7px;font-size:12.5px;color:#0284c7;padding:8px 0;}
        .att-proc-spin{width:13px;height:13px;border:2px solid rgba(14,165,233,.25);border-top-color:#0284c7;border-radius:50%;animation:att-spin .65s linear infinite;}
        @keyframes att-spin{to{transform:rotate(360deg)}}
      `}</style>

      <div>
        <div className="att-header">
          <div>
            <div className="att-title">Điểm danh</div>
            <div className="att-subtitle">Xem lịch sử, điểm danh thủ công và quét QR</div>
          </div>
          <div className="att-export-row">
            <button type="button" onClick={onExportCsv} className="att-btn att-btn-csv">
              <svg viewBox="0 0 14 14" fill="none" width="13" height="13"><path d="M2 10v2h10v-2M7 2v7M4 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Xuất CSV
            </button>
            <button type="button" onClick={onExportXlsx} className="att-btn att-btn-xlsx">
              <svg viewBox="0 0 14 14" fill="none" width="13" height="13"><path d="M2 10v2h10v-2M7 2v7M4 7l3 3 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Xuất Excel
            </button>
          </div>
        </div>

        <div className="att-layout">
          {/* Left: table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Filters */}
            <div className="att-card">
              <div className="att-card-head">
                <span className="att-card-title">Bộ lọc</span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span className="att-count-badge">{filtered.length} sinh viên</span>
                   {eventId !== 'all' && (
                    <>
                      <span className="att-count-attended">
                        ✓ {filtered.filter(r => r.registration_status === 'attended').length} đã điểm danh
                      </span>
                      <span className="att-count-attended" style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', marginLeft: 6 }}>
                        ✕ {filtered.filter(r => r.registration_status === 'cancelled').length} đã hủy
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="att-card-body">
                <div className="att-filters">
                  <select className="att-select" value={eventId} onChange={e => {
                    setEventId(e.target.value === 'all' ? 'all' : e.target.value);
                  }}>
                    <option value="all">Tất cả sự kiện (chỉ checked-in)</option>
                    {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                  </select>
                  <input type="text" placeholder="Tìm sinh viên, email, sự kiện..." className="att-search-input" value={search} onChange={e => setSearch(e.target.value)} />
                  <button type="button" onClick={() => void reload(eventId, search)} className="att-apply-btn">Lọc</button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="att-card">
              <div style={{ overflowX: 'auto' }}>
                <table className="att-table">
                  <thead><tr>
                    <th>Sinh viên</th>
                    <th>Sự kiện</th>
                    <th>Giờ điểm danh</th>
                    <th>Trạng thái</th>
                  </tr></thead>
                  <tbody>
                    {filtered.map(r => (
                      <tr key={`${r.registration_id}-${r.user_id}`}>
                        <td>
                          <div className="att-student-name">{r.student_name}</div>
                          <div className="att-student-email">{r.email}</div>
                          {r.student_code && <div className="att-student-email">{r.student_code}</div>}
                        </td>
                        <td style={{ fontSize: 13, color: '#334155', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.event_title}</td>
                        <td style={{ fontSize: 12.5, color: '#64748b', whiteSpace: 'nowrap' }}>
                          {(() => {
                            const time = r.check_in_time || (r as any).checkin_time || (r as any).checkInTime || (r as any).CHECK_IN_TIME;
                            if (time) return new Date(time).toLocaleString('vi-VN');
                            if (r.registration_status === 'attended' && r.registered_at) {
                              return new Date(r.registered_at).toLocaleString('vi-VN') + ' (*)';
                            }
                            return '—';
                          })()}
                        </td>
                        <td>
                           <span className={`att-badge ${r.registration_status === 'cancelled' ? 'att-badge-cancelled' : r.registration_status === 'attended' ? 'att-badge-attended' : 'att-badge-reg'}`}>
                            {r.registration_status === 'cancelled' ? '✕ Đã hủy' : r.registration_status === 'attended' ? '✓ Đã điểm danh' : '○ Chưa điểm danh'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={4} className="att-empty">📭 Không có bản ghi nào</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right: sidebar tools */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Manual */}
            <div className="att-card">
              <div className="att-card-head"><span className="att-card-title">Điểm danh thủ công</span></div>
              <div className="att-card-body">
                <p style={{ fontSize: 12.5, color: '#94a3b8', marginBottom: 12 }}>
                  Nhập <strong style={{ color: '#334155' }}>Mã số sinh viên (MSSV)</strong> và chọn sự kiện để điểm danh
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="Mã số sinh viên (vd: SV00001)"
                    className="att-manual-text"
                    value={manualStudentCode}
                    onChange={e => setManualStudentCode(e.target.value.toUpperCase())}
                    onKeyDown={e => { if (e.key === 'Enter') void onManualCheckin(); }}
                  />
                  <select
                    className="att-select"
                    style={{ width: '100%' }}
                    value={manualEventId}
                    onChange={e => setManualEventId(e.target.value)}
                  >
                    <option value="">-- Chọn sự kiện --</option>
                    {events.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={() => void onManualCheckin()}
                    className="att-checkin-btn"
                    disabled={manualLoading}
                    style={{ opacity: manualLoading ? 0.7 : 1 }}
                  >
                    {manualLoading ? 'Đang xử lý...' : '✓ Điểm danh'}
                  </button>
                  {manualResult && (
                    <div style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      background: manualResult.ok ? '#f0fdf4' : '#fff1f2',
                      color: manualResult.ok ? '#15803d' : '#be123c',
                      border: `1px solid ${manualResult.ok ? '#bbf7d0' : '#fecaca'}`
                    }}>
                      {manualResult.msg}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* QR */}
            <div className="att-card">
              <div className="att-card-head">
                <span className="att-card-title">Quét QR</span>
                <button type="button" onClick={() => setScanning(v => !v)} className={`att-scan-toggle ${scanning ? 'stop' : ''}`}>
                  {scanning ? '⏹ Dừng' : '▶ Bắt đầu'}
                </button>
              </div>
              <div className="att-card-body">
                {scanning && (
                  <div style={{ borderRadius: 10, overflow: 'hidden', border: '2px solid #e0eeff', marginBottom: 12 }}>
                    <QrReader
                      constraints={{ facingMode: 'environment' }}
                      onResult={(result) => { const text = result?.getText?.(); if (text) void handleScan(text); }}
                      containerStyle={{ width: '100%' }}
                    />
                  </div>
                )}
                {processingScan && (
                  <div className="att-processing">
                    <div className="att-proc-spin" />Đang xử lý...
                  </div>
                )}
                <div>
                  {scanResults.length === 0 && <div className="att-scan-empty">Chưa có kết quả quét nào</div>}
                  {scanResults.map((r, i) => (
                    <div key={`${r.at}-${i}`} className={`att-scan-result ${r.ok ? 'ok' : 'fail'}`}>
                      <div className={`att-scan-msg ${r.ok ? 'ok' : 'fail'}`}>{r.ok ? '✓' : '✗'} {r.message}</div>
                      <div className="att-scan-time">{new Date(r.at).toLocaleString('vi-VN')}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AttendancePage;
