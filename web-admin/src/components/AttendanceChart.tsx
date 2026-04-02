import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type AttendanceRatePoint = {
  name: string;
  attendance_rate: number;
  registered: number;
  attended: number;
};

type AttendanceChartProps = {
  attendanceRateData: AttendanceRatePoint[];
  registeredTotal: number;
  attendedTotal: number;
};

const PIE_COLORS = ['#0284c7', '#bae6fd'];

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: '#fff', border: '1px solid #e0eeff',
        borderRadius: 10, padding: '10px 14px',
        boxShadow: '0 4px 16px rgba(14,165,233,0.12)',
        fontSize: 13,
      }}>
        <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>{label}</div>
        <div style={{ color: '#0284c7', marginBottom: 3 }}>Tỉ lệ: <strong>{payload[0].value}%</strong></div>
        <div style={{ color: '#64748b', fontSize: 12 }}>Điểm danh: <strong>{(payload[0].payload as AttendanceRatePoint).attended}</strong> / Đăng ký: <strong>{(payload[0].payload as AttendanceRatePoint).registered}</strong></div>
      </div>
    );
  }
  return null;
};

const AttendanceChart: React.FC<AttendanceChartProps> = ({
  attendanceRateData,
  registeredTotal,
  attendedTotal,
}) => {
  const pieData = [
    { name: 'Đã điểm danh', value: attendedTotal },
    { name: 'Chưa điểm danh', value: Math.max(0, registeredTotal - attendedTotal) },
  ];

  const checkinPct = registeredTotal > 0
    ? Math.round((attendedTotal / registeredTotal) * 100)
    : 0;

  return (
    <>
      <style>{`
        .ac-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: 1fr 1fr;
        }
        @media(max-width: 900px){ .ac-grid{ grid-template-columns: 1fr; } }

        .ac-card {
          background: #fff;
          border-radius: 14px;
          padding: 22px 22px 16px;
          border: 1px solid #e0eeff;
          box-shadow: 0 1px 4px rgba(14,165,233,0.06), 0 4px 16px rgba(14,165,233,0.05);
        }
        .ac-card-title {
          font-size: 13.5px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 4px;
        }
        .ac-card-sub {
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 18px;
        }

        /* Pie center label */
        .ac-pie-wrap {
          position: relative;
        }
        .ac-pie-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -58%);
          text-align: center;
          pointer-events: none;
        }
        .ac-pie-pct {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -1px;
          line-height: 1;
        }
        .ac-pie-label {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 3px;
        }

        .ac-stat-row {
          display: flex;
          gap: 20px;
          margin-top: 14px;
          padding-top: 14px;
          border-top: 1px solid #f1f5f9;
        }
        .ac-stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
        }
        .ac-stat-dot {
          width: 10px; height: 10px;
          border-radius: 3px;
          flex-shrink: 0;
        }
        .ac-stat-num {
          font-weight: 700;
          color: #0f172a;
        }
        .ac-stat-lbl { color: #94a3b8; }
      `}</style>

      <div className="ac-grid">
        {/* Bar Chart */}
        <div className="ac-card">
          <div className="ac-card-title">Tỉ lệ điểm danh theo sự kiện</div>
          <div className="ac-card-sub">% sinh viên đã điểm danh / đã đăng ký</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={attendanceRateData} barSize={22}
              margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f7ff" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#f0f7ff' }} />
              <Bar dataKey="attendance_rate" name="Tỉ lệ" fill="url(#barGrad)"
                radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="ac-card">
          <div className="ac-card-title">Điểm danh vs Đã đăng ký</div>
          <div className="ac-card-sub">Tổng quan tình trạng điểm danh</div>
          <div className="ac-pie-wrap">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={72}
                  outerRadius={100}
                  paddingAngle={3}
                  startAngle={90}
                  endAngle={-270}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #e0eeff',
                    borderRadius: 10,
                    boxShadow: '0 4px 16px rgba(14,165,233,0.12)',
                    fontSize: 13,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="ac-pie-center">
              <div className="ac-pie-pct">{checkinPct}%</div>
              <div className="ac-pie-label">điểm danh</div>
            </div>
          </div>
          <div className="ac-stat-row">
            <div className="ac-stat-item">
              <div className="ac-stat-dot" style={{ background: '#0284c7' }} />
              <span className="ac-stat-num">{attendedTotal}</span>
              <span className="ac-stat-lbl">Đã điểm danh</span>
            </div>
            <div className="ac-stat-item">
              <div className="ac-stat-dot" style={{ background: '#bae6fd' }} />
              <span className="ac-stat-num">{Math.max(0, registeredTotal - attendedTotal)}</span>
              <span className="ac-stat-lbl">Chưa điểm danh</span>
            </div>
            <div className="ac-stat-item">
              <span className="ac-stat-lbl">Tổng:</span>
              <span className="ac-stat-num">{registeredTotal}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AttendanceChart;
