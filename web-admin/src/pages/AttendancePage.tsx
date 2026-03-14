import React, { useEffect, useMemo, useState } from 'react';
import { QrReader } from 'react-qr-reader';
import { attendanceApi, type AttendanceListRecord } from '../api/attendanceApi';
import { eventApi, type Event } from '../api/eventApi';
import { exportToCsv, exportToXlsx } from '../utils/exporters';
import { notifySuccess } from '../utils/notify';

type ScanResult = { at: string; ok: boolean; message: string; };

const AttendancePage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [records, setRecords] = useState<AttendanceListRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventId, setEventId] = useState<number | 'all'>('all');
  const [search, setSearch] = useState('');
  const [manualRegId, setManualRegId] = useState('');
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [scanning, setScanning] = useState(false);
  const [processingScan, setProcessingScan] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [evsRes, attRes] = await Promise.all([
          eventApi.getAllEvents(),
          attendanceApi.listAttendance(),
        ]);
        setEvents(Array.isArray(evsRes) ? evsRes : []);
        const data = attRes.data?.data ?? attRes.data;
        setRecords(Array.isArray(data) ? data : []);
      } finally { setLoading(false); }
    };
    void load();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return records.filter((r) => {
      if (eventId !== 'all' && r.event_id !== eventId) return false;
      if (!term) return true;
      return (
        (r.student_name ?? '').toLowerCase().includes(term) ||
        (r.email ?? '').toLowerCase().includes(term) ||
        (r.student_code ?? '').toLowerCase().includes(term) ||
        (r.event_title ?? '').toLowerCase().includes(term)
      );
    });
  }, [records, eventId, search]);

  const reload = async () => {
    setLoading(true);
    try {
      const res = await attendanceApi.listAttendance({
        event_id: eventId === 'all' ? undefined : eventId,
        search: search.trim() ? search.trim() : undefined,
      });
      const data = res.data?.data ?? res.data;
      setRecords(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  };

  const onManualCheckin = async () => {
    const id = parseInt(manualRegId, 10);
    if (!Number.isInteger(id) || id <= 0) return;
    const res = await attendanceApi.manualCheckIn(id);
    notifySuccess(res.data?.message || 'Check-in thủ công thành công');
    setManualRegId('');
    await reload();
  };

  const onExportCsv = () => {
    const header = ['Tên sinh viên','Email','Mã SV','Sự kiện','Giờ check-in'];
    const rows = filtered.map((r) => [r.student_name,r.email,r.student_code??'',r.event_title,r.check_in_time?new Date(r.check_in_time).toLocaleString('vi-VN'):'']);
    exportToCsv('attendance-report.csv', header, rows);
  };

  const onExportXlsx = () => {
    const header = ['Tên sinh viên','Email','Mã SV','Sự kiện','Giờ check-in'];
    const rows = filtered.map((r) => [r.student_name,r.email,r.student_code??'',r.event_title,r.check_in_time?new Date(r.check_in_time).toLocaleString('vi-VN'):'']);
    exportToXlsx('attendance-report.xlsx', 'Attendance', header, rows);
  };

  const handleScan = async (text: string) => {
    if (processingScan) return;
    setProcessingScan(true);
    try {
      const res = await attendanceApi.checkIn(text);
      const msg = res.data?.message || 'Check-in thành công';
      setScanResults(prev => [{ at: new Date().toISOString(), ok: true, message: msg }, ...prev].slice(0, 8));
      notifySuccess(msg);
      await reload();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Check-in thất bại. Kiểm tra lại mã QR.';
      setScanResults(prev => [{ at: new Date().toISOString(), ok: false, message: msg }, ...prev].slice(0, 8));
    } finally { setProcessingScan(false); }
  };

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:300,gap:12,color:'#94a3b8',fontSize:13}}>
      <div style={{width:20,height:20,border:'2px solid #e0eeff',borderTopColor:'#0284c7',borderRadius:'50%',animation:'att-spin .7s linear infinite'}}/>
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
        .att-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:20px;font-size:11.5px;font-weight:600;}
        .att-badge-attended{background:#f0fdf4;color:#15803d;}
        .att-badge-reg{background:#eff6ff;color:#1d4ed8;}
        .att-empty{padding:40px 16px;text-align:center;color:#94a3b8;font-size:13px;}
        .att-count-badge{font-size:12px;color:#64748b;background:#f0f7ff;border:1px solid #e0eeff;padding:4px 10px;border-radius:20px;}

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
            <div className="att-subtitle">Xem lịch sử, check-in thủ công và quét QR</div>
          </div>
          <div className="att-export-row">
            <button type="button" onClick={onExportCsv} className="att-btn att-btn-csv">
              <svg viewBox="0 0 14 14" fill="none" width="13" height="13"><path d="M2 10v2h10v-2M7 2v7M4 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Xuất CSV
            </button>
            <button type="button" onClick={onExportXlsx} className="att-btn att-btn-xlsx">
              <svg viewBox="0 0 14 14" fill="none" width="13" height="13"><path d="M2 10v2h10v-2M7 2v7M4 7l3 3 3-3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Xuất Excel
            </button>
          </div>
        </div>

        <div className="att-layout">
          {/* Left: table */}
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {/* Filters */}
            <div className="att-card">
              <div className="att-card-head">
                <span className="att-card-title">Bộ lọc</span>
                <span className="att-count-badge">{filtered.length} bản ghi</span>
              </div>
              <div className="att-card-body">
                <div className="att-filters">
                  <select className="att-select" value={eventId} onChange={e=>setEventId(e.target.value==='all'?'all':Number(e.target.value))}>
                    <option value="all">Tất cả sự kiện</option>
                    {events.map(ev=><option key={ev.id} value={ev.id}>{ev.title}</option>)}
                  </select>
                  <input type="text" placeholder="Tìm sinh viên, email, sự kiện..." className="att-search-input" value={search} onChange={e=>setSearch(e.target.value)}/>
                  <button type="button" onClick={()=>void reload()} className="att-apply-btn">Lọc</button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="att-card">
              <div style={{overflowX:'auto'}}>
                <table className="att-table">
                  <thead><tr>
                    <th>Sinh viên</th>
                    <th>Sự kiện</th>
                    <th>Giờ check-in</th>
                    <th>Trạng thái</th>
                  </tr></thead>
                  <tbody>
                    {filtered.map(r=>(
                      <tr key={r.attendance_id}>
                        <td>
                          <div className="att-student-name">{r.student_name}</div>
                          <div className="att-student-email">{r.email}</div>
                          {r.student_code && <div className="att-student-email">{r.student_code}</div>}
                        </td>
                        <td style={{fontSize:13,color:'#334155',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.event_title}</td>
                        <td style={{fontSize:12.5,color:'#64748b',whiteSpace:'nowrap'}}>{r.check_in_time?new Date(r.check_in_time).toLocaleString('vi-VN'):'—'}</td>
                        <td>
                          <span className={`att-badge ${r.registration_status==='attended'?'att-badge-attended':'att-badge-reg'}`}>
                            {r.registration_status==='attended'?'✓ Đã check-in':r.registration_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filtered.length===0&&(
                      <tr><td colSpan={4} className="att-empty">📭 Không có bản ghi nào</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right: sidebar tools */}
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {/* Manual */}
            <div className="att-card">
              <div className="att-card-head"><span className="att-card-title">Check-in thủ công</span></div>
              <div className="att-card-body">
                <p style={{fontSize:12.5,color:'#94a3b8',marginBottom:12}}>Nhập <strong style={{color:'#334155'}}>Registration ID</strong> để đánh dấu điểm danh</p>
                <div className="att-manual-input">
                  <input type="text" placeholder="Registration ID" className="att-manual-text" value={manualRegId} onChange={e=>setManualRegId(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')void onManualCheckin();}}/>
                  <button type="button" onClick={()=>void onManualCheckin()} className="att-checkin-btn">Check-in</button>
                </div>
              </div>
            </div>

            {/* QR */}
            <div className="att-card">
              <div className="att-card-head">
                <span className="att-card-title">Quét QR</span>
                <button type="button" onClick={()=>setScanning(v=>!v)} className={`att-scan-toggle ${scanning?'stop':''}`}>
                  {scanning?'⏹ Dừng':'▶ Bắt đầu'}
                </button>
              </div>
              <div className="att-card-body">
                {scanning && (
                  <div style={{borderRadius:10,overflow:'hidden',border:'2px solid #e0eeff',marginBottom:12}}>
                    <QrReader
                      constraints={{ facingMode: 'environment' }}
                      onResult={(result) => { const text=result?.getText?.(); if(text) void handleScan(text); }}
                      containerStyle={{ width: '100%' }}
                    />
                  </div>
                )}
                {processingScan && (
                  <div className="att-processing">
                    <div className="att-proc-spin"/>Đang xử lý...
                  </div>
                )}
                <div>
                  {scanResults.length===0 && <div className="att-scan-empty">Chưa có kết quả quét nào</div>}
                  {scanResults.map((r,i)=>(
                    <div key={`${r.at}-${i}`} className={`att-scan-result ${r.ok?'ok':'fail'}`}>
                      <div className={`att-scan-msg ${r.ok?'ok':'fail'}`}>{r.ok?'✓':'✗'} {r.message}</div>
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