import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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

const AttendanceChart: React.FC<AttendanceChartProps> = ({
  attendanceRateData,
  registeredTotal,
  attendedTotal,
}) => {
  const pieData = [
    { name: 'Checked-in', value: attendedTotal },
    { name: 'Registered (not checked-in)', value: Math.max(0, registeredTotal - attendedTotal) },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="text-sm font-semibold text-slate-800">
          Event Attendance Rate
        </div>
        <div className="mt-3 w-full min-h-[300px]">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceRateData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v: any) => `${v}%`} />
              <Legend />
              <Bar dataKey="attendance_rate" name="Attendance rate" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="text-sm font-semibold text-slate-800">
          Check-in vs Registered
        </div>
        <div className="mt-3 w-full min-h-[300px]">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Tooltip />
              <Legend />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={2}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-xs text-slate-500">
          Registered: <span className="font-medium text-slate-700">{registeredTotal}</span> · Checked-in:{' '}
          <span className="font-medium text-slate-700">{attendedTotal}</span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceChart;

