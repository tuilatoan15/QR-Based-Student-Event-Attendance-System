import React from 'react';
import { Link } from 'react-router-dom';
import type { Event } from '../api/eventApi';

type Props = {
  events: Event[];
  onDelete: (id: string) => void;
};

const EventTable: React.FC<Props> = ({ events, onDelete }) => {
  return (
    <>
      <style>{`
        .et-wrap{background:#fff;border-radius:14px;border:1px solid #e0eeff;box-shadow:0 1px 4px rgba(14,165,233,.06),0 4px 16px rgba(14,165,233,.05);overflow:hidden;}
        .et-table{width:100%;border-collapse:collapse;font-size:13.5px;}
        .et-table thead tr{background:#f8fbff;border-bottom:1px solid #e0eeff;}
        .et-table thead th{padding:12px 16px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;white-space:nowrap;}
        .et-table thead th:last-child{text-align:right;}
        .et-table tbody tr{border-bottom:1px solid #f1f8ff;transition:background .12s;}
        .et-table tbody tr:last-child{border-bottom:none;}
        .et-table tbody tr:hover{background:#f8fbff;}
        .et-table tbody td{padding:13px 16px;color:#334155;vertical-align:middle;}
        .et-title-link{font-weight:600;color:#0284c7;text-decoration:none;font-size:13.5px;}
        .et-title-link:hover{color:#0369a1;text-decoration:underline;}
        .et-id{font-size:11.5px;color:#94a3b8;margin-top:2px;}
        .et-loc{display:flex;align-items:center;gap:5px;color:#64748b;font-size:13px;}
        .et-time{font-size:12.5px;color:#64748b;white-space:nowrap;}
        .et-max{font-weight:600;color:#0f172a;font-size:13px;}
        .et-actions{display:flex;align-items:center;justify-content:flex-end;gap:6px;flex-wrap:nowrap;}
        .et-btn{display:inline-flex;align-items:center;gap:4px;padding:5px 11px;border-radius:7px;font-size:12px;font-weight:600;text-decoration:none;transition:all .14s;white-space:nowrap;border:none;cursor:pointer;font-family:inherit;}
        .et-btn-edit{background:#eff6ff;color:#1d4ed8;}.et-btn-edit:hover{background:#dbeafe;color:#1e40af;}
        .et-btn-parts{background:#f0f7ff;color:#0284c7;}.et-btn-parts:hover{background:#e0f2fe;color:#0369a1;}
        .et-btn-scan{background:#f0fdf4;color:#15803d;}.et-btn-scan:hover{background:#dcfce7;color:#166534;}
        .et-btn-del{background:#fff1f2;color:#be123c;}.et-btn-del:hover{background:#ffe4e6;color:#9f1239;}
        .et-empty{padding:48px 16px;text-align:center;color:#94a3b8;font-size:13.5px;}
        .et-empty-icon{font-size:32px;margin-bottom:10px;}
      `}</style>
      <div className="et-wrap">
        <div style={{overflowX:'auto'}}>
          <table className="et-table">
            <thead>
              <tr>
                <th>Tên sự kiện</th>
                <th>Địa điểm</th>
                <th>Bắt đầu</th>
                <th>Kết thúc</th>
                <th>Số lượng</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>
                    <Link to={`/events/${event.id}`} className="et-title-link">{event.title}</Link>
                    <div className="et-id">#{event.id}</div>
                  </td>
                  <td>
                    <div className="et-loc">
                      <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
                        <path d="M8 1.5A4 4 0 018 9.5S4 12 4 6a4 4 0 014-4.5z" stroke="#94a3b8" strokeWidth="1.2" fill="#e0f2fe"/>
                        <circle cx="8" cy="6" r="1.5" fill="#0284c7"/>
                      </svg>
                      {event.location}
                    </div>
                  </td>
                  <td><span className="et-time">{new Date(event.start_time).toLocaleString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}</span></td>
                  <td><span className="et-time">{new Date(event.end_time).toLocaleString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}</span></td>
                  <td><span className="et-max">{event.max_participants}</span></td>
                  <td>
                    <div className="et-actions">
                      <Link to={`/events/${event.id}/edit`} className="et-btn et-btn-edit">
                        <svg viewBox="0 0 14 14" fill="none" width="11" height="11"><path d="M9 2l3 3L4 13H1v-3L9 2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
                        Sửa
                      </Link>
                      <Link to={`/events/${event.id}/participants`} className="et-btn et-btn-parts">
                        <svg viewBox="0 0 14 14" fill="none" width="11" height="11"><circle cx="5" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1 12v-1a4 4 0 014-4h0a4 4 0 014 4v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M10 2a2.5 2.5 0 010 4.5M12 12v-1a4 4 0 00-2-3.46" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                        Tham dự viên
                      </Link>
                      <Link to={`/qr-scanner?eventId=${event.id}`} className="et-btn et-btn-scan">
                        <svg viewBox="0 0 14 14" fill="none" width="11" height="11"><path d="M1 4V2.5A1.5 1.5 0 012.5 1H4M10 1h1.5A1.5 1.5 0 0113 2.5V4M13 10v1.5A1.5 1.5 0 0111.5 13H10M4 13H2.5A1.5 1.5 0 011 11.5V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><rect x="3.5" y="3.5" width="3" height="3" rx=".5" stroke="currentColor" strokeWidth="1.2"/><rect x="7.5" y="7.5" width="3" height="3" rx=".5" stroke="currentColor" strokeWidth="1.2"/></svg>
                        Quét QR
                      </Link>
                      <button onClick={() => onDelete(event.id)} className="et-btn et-btn-del">
                        <svg viewBox="0 0 14 14" fill="none" width="11" height="11"><path d="M2 3.5h10M5.5 3.5V2.5h3v1M6 6v4M8 6v4M3 3.5l1 8.5h6l1-8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr><td colSpan={6} className="et-empty"><div className="et-empty-icon">📭</div>Không có sự kiện nào</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default EventTable;
