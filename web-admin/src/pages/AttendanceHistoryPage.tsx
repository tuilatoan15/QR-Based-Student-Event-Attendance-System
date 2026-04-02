import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { attendanceApi, type AttendanceRecord } from '../api/attendanceApi';

const AttendanceHistoryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await attendanceApi.getEventAttendance(id);
        const data = res.data.data ?? res.data;
        setRecords(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            'Unable to load attendance history. Please try again.',
        );
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return records;
    return records.filter((r) => {
      const name = (r.student_name ?? '').toLowerCase();
      return name.includes(term);
    });
  }, [records, search]);

  if (loading) return <div>Loading attendance...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-slate-800">
          Attendance History
        </h2>
        <input
          type="text"
          placeholder="Search by student name..."
          className="w-64 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Student
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Event
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Check-in Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((r) => (
              <tr key={r.registration_id}>
                <td className="px-4 py-2 text-sm text-slate-800">
                  {r.student_name ?? '-'}
                </td>
                <td className="px-4 py-2 text-sm text-slate-600">
                  {r.event_title ?? `#${r.event_id}`}
                </td>
                <td className="px-4 py-2 text-sm text-slate-600">
                  {r.check_in_time
                    ? new Date(r.check_in_time).toLocaleString()
                    : '-'}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-4 text-center text-sm text-slate-500"
                >
                  No attendance records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceHistoryPage;

