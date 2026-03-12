import React from 'react';
import { Link } from 'react-router-dom';

export type DashboardEventRow = {
  id: number;
  title: string;
  location: string;
  start_time: string;
  registered: number;
  checked_in: number;
};

type DashboardEventTableProps = {
  rows: DashboardEventRow[];
};

const DashboardEventTable: React.FC<DashboardEventTableProps> = ({ rows }) => {
  return (
    <>
      <style>{`
        .det-wrap {
          background: #fff;
          border-radius: 14px;
          border: 1px solid #e0eeff;
          box-shadow: 0 1px 4px rgba(14,165,233,0.06), 0 4px 16px rgba(14,165,233,0.05);
          overflow: hidden;
        }
        .det-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13.5px;
        }
        .det-table thead tr {
          border-bottom: 1px solid #e8f2ff;
          background: #f8fbff;
        }
        .det-table thead th {
          padding: 12px 16px;
          text-align: left;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .06em;
          color: #94a3b8;
          white-space: nowrap;
        }
        .det-table thead th:last-child { text-align: right; }
        .det-table tbody tr {
          border-bottom: 1px solid #f1f8ff;
          transition: background .12s;
        }
        .det-table tbody tr:last-child { border-bottom: none; }
        .det-table tbody tr:hover { background: #f8fbff; }
        .det-table tbody td {
          padding: 13px 16px;
          color: #334155;
          vertical-align: middle;
        }

        .det-event-name {
          font-weight: 600;
          color: #0f172a;
          font-size: 13.5px;
        }
        .det-event-id {
          font-size: 11.5px;
          color: #94a3b8;
          margin-top: 2px;
        }

        .det-location {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #64748b;
          font-size: 13px;
        }

        .det-badge-reg {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 36px;
          padding: 3px 8px;
          border-radius: 20px;
          background: #eff6ff;
          color: #1d4ed8;
          font-weight: 700;
          font-size: 12.5px;
        }
        .det-badge-chk {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 36px;
          padding: 3px 8px;
          border-radius: 20px;
          background: #f0fdf4;
          color: #15803d;
          font-weight: 700;
          font-size: 12.5px;
        }

        .det-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 6px;
        }
        .det-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 12px;
          border-radius: 7px;
          font-size: 12.5px;
          font-weight: 600;
          text-decoration: none;
          transition: all .14s;
          white-space: nowrap;
          border: none;
          cursor: pointer;
        }
        .det-btn-view {
          background: #eff6ff;
          color: #1d4ed8;
        }
        .det-btn-view:hover {
          background: #dbeafe;
          color: #1e40af;
        }
        .det-btn-scan {
          background: #f0fdf4;
          color: #15803d;
        }
        .det-btn-scan:hover {
          background: #dcfce7;
          color: #166534;
        }
        .det-btn-edit {
          background: #f0f7ff;
          color: #0284c7;
        }
        .det-btn-edit:hover {
          background: #e0f2fe;
          color: #0369a1;
        }

        .det-empty {
          padding: 48px 16px;
          text-align: center;
          color: #94a3b8;
          font-size: 13.5px;
        }
        .det-empty-icon {
          font-size: 32px;
          margin-bottom: 10px;
        }
      `}</style>

      <div className="det-wrap">
        <div style={{ overflowX: 'auto' }}>
          <table className="det-table">
            <thead>
              <tr>
                <th>Tên sự kiện</th>
                <th>Địa điểm</th>
                <th>Thời gian</th>
                <th>Đăng ký</th>
                <th>Check-in</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="det-event-name">{r.title}</div>
                    <div className="det-event-id">#{r.id}</div>
                  </td>
                  <td>
                    <div className="det-location">
                      <svg viewBox="0 0 16 16" fill="none" width="13" height="13">
                        <path d="M8 1.5A4.5 4.5 0 018 10.5S3.5 13.5 3.5 6A4.5 4.5 0 018 1.5z"
                          stroke="#94a3b8" strokeWidth="1.3" fill="#e0eeff"/>
                        <circle cx="8" cy="6" r="1.5" fill="#0284c7"/>
                      </svg>
                      {r.location}
                    </div>
                  </td>
                  <td style={{ color: '#64748b', fontSize: 12.5, whiteSpace: 'nowrap' }}>
                    {r.start_time
                      ? new Date(r.start_time).toLocaleString('vi-VN', {
                          day: '2-digit', month: '2-digit', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })
                      : '—'}
                  </td>
                  <td>
                    <span className="det-badge-reg">{r.registered}</span>
                  </td>
                  <td>
                    <span className="det-badge-chk">{r.checked_in}</span>
                  </td>
                  <td>
                    <div className="det-actions">
                      <Link to={`/events/${r.id}`} className="det-btn det-btn-view">
                        <svg viewBox="0 0 16 16" fill="none" width="12" height="12">
                          <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.4"/>
                          <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.4"/>
                        </svg>
                        Xem
                      </Link>
                      <Link to={`/qr-scanner?eventId=${r.id}`} className="det-btn det-btn-scan">
                        <svg viewBox="0 0 16 16" fill="none" width="12" height="12">
                          <path d="M2 5V3.5A1.5 1.5 0 013.5 2H5M11 2h1.5A1.5 1.5 0 0114 3.5V5M14 11v1.5A1.5 1.5 0 0112.5 14H11M5 14H3.5A1.5 1.5 0 012 12.5V11"
                            stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                          <rect x="5" y="5" width="3" height="3" rx=".5" stroke="currentColor" strokeWidth="1.3"/>
                          <rect x="8" y="8" width="3" height="3" rx=".5" stroke="currentColor" strokeWidth="1.3"/>
                        </svg>
                        Quét QR
                      </Link>
                      <Link to={`/events/${r.id}/edit`} className="det-btn det-btn-edit">
                        <svg viewBox="0 0 16 16" fill="none" width="12" height="12">
                          <path d="M10.5 2.5l3 3L5 14H2v-3L10.5 2.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
                        </svg>
                        Sửa
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="det-empty">
                    <div className="det-empty-icon">📭</div>
                    Không có sự kiện nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default DashboardEventTable;