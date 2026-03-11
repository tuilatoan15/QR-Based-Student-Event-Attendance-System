import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { eventApi } from '../api/eventApi';

type Registration = {
  id: number;
  student_name?: string;
  email?: string;
  registration_status?: string;
  registered_at?: string;
  checkin_time?: string | null;
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
      setLoading(true);
      setError(null);
      try {
        const res = await eventApi.getEventRegistrations(Number(id));
        const data = res.data.data ?? res.data;
        setRegistrations(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            'Unable to load registrations. Please try again.',
        );
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [id]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return registrations.filter((reg) => {
      if (
        statusFilter !== 'all' &&
        (reg.registration_status ?? '').toLowerCase() !== statusFilter
      ) {
        return false;
      }
      if (!term) return true;
      const name = (reg.student_name ?? '').toLowerCase();
      const email = (reg.email ?? '').toLowerCase();
      return name.includes(term) || email.includes(term);
    });
  }, [registrations, search, statusFilter]);

  const handleExportCsv = () => {
    if (registrations.length === 0) return;
    const header = ['Student Name', 'Email', 'Status', 'Registered At', 'Check-in Time'];
    const rows = registrations.map((reg) => [
      reg.student_name ?? '',
      reg.email ?? '',
      reg.registration_status ?? '',
      reg.registered_at ?? '',
      reg.checkin_time ?? '',
    ]);
    const csvContent =
      [header, ...rows]
        .map((cols) =>
          cols
            .map((c) => `"${String(c).replace(/"/g, '""')}"`)
            .join(','),
        )
        .join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `event-${id}-participants.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) return <div>Loading participants...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-800">
          Event Participants
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-56 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as typeof statusFilter)
            }
          >
            <option value="all">All</option>
            <option value="registered">Registered</option>
            <option value="attended">Attended</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            type="button"
            onClick={handleExportCsv}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Export CSV
          </button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Student
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Email
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Registered At
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Check-in Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((reg) => (
              <tr key={reg.id}>
                <td className="px-4 py-2 text-sm text-slate-800">
                  {reg.student_name ?? '-'}
                </td>
                <td className="px-4 py-2 text-sm text-slate-600">
                  {reg.email ?? '-'}
                </td>
                <td className="px-4 py-2 text-sm text-slate-600">
                  {reg.registered_at
                    ? new Date(reg.registered_at).toLocaleString()
                    : '-'}
                </td>
                <td className="px-4 py-2 text-sm text-slate-600">
                  {reg.registration_status ?? '-'}
                </td>
                <td className="px-4 py-2 text-sm text-slate-600">
                  {reg.checkin_time
                    ? new Date(reg.checkin_time).toLocaleString()
                    : '-'}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-4 text-center text-sm text-slate-500"
                >
                  No registrations yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EventRegistrationsPage;

