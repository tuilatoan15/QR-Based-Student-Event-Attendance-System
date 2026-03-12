import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { eventApi } from '../api/eventApi';
import { exportToCsv, exportToXlsx } from '../utils/exporters';
import { notifySuccess } from '../utils/notify';

type Registration = {
  id: number;
  registration_id?: number;
  user_id?: number;
  student_name?: string;
  email?: string;
  student_code?: string;
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
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'pending' | 'approved' | 'cancelled'
  >('all');
  const [busyId, setBusyId] = useState<number | null>(null);

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

  const statusForFilter = (raw?: string) => {
    const s = (raw ?? '').toLowerCase();
    if (s === 'cancelled') return 'cancelled';
    if (s === 'attended') return 'approved';
    return 'pending';
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return registrations.filter((reg) => {
      if (statusFilter !== 'all' && statusForFilter(reg.registration_status) !== statusFilter) {
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
    const header = [
      'Student Name',
      'Email',
      'Student Code',
      'Status',
      'Registered At',
      'Check-in Time',
    ];
    const rows = registrations.map((reg) => [
      reg.student_name ?? '',
      reg.email ?? '',
      reg.student_code ?? '',
      reg.registration_status ?? '',
      reg.registered_at ?? '',
      reg.checkin_time ?? '',
    ]);
    exportToCsv(`event-${id}-participants.csv`, header, rows);
  };

  const handleExportXlsx = () => {
    if (registrations.length === 0) return;
    const header = [
      'Student Name',
      'Email',
      'Student Code',
      'Status',
      'Registered At',
      'Check-in Time',
    ];
    const rows = registrations.map((reg) => [
      reg.student_name ?? '',
      reg.email ?? '',
      reg.student_code ?? '',
      reg.registration_status ?? '',
      reg.registered_at ?? '',
      reg.checkin_time ?? '',
    ]);
    exportToXlsx(`event-${id}-participants.xlsx`, 'Participants', header, rows);
  };

  const updateStatus = async (registrationId: number, status: 'registered' | 'cancelled') => {
    if (!id) return;
    setBusyId(registrationId);
    try {
      const res = await eventApi.updateRegistrationStatus(
        Number(id),
        registrationId,
        status,
      );
      notifySuccess(res.data?.message || 'Updated');
      // Refresh list
      const regsRes = await eventApi.getEventRegistrations(Number(id));
      const data = regsRes.data.data ?? regsRes.data;
      setRegistrations(Array.isArray(data) ? data : []);
    } finally {
      setBusyId(null);
    }
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
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            type="button"
            onClick={handleExportCsv}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={handleExportXlsx}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Export Excel
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
                Student Code
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
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((reg) => (
              <tr key={reg.registration_id ?? reg.id}>
                <td className="px-4 py-2 text-sm text-slate-800">
                  {reg.student_name ?? '-'}
                </td>
                <td className="px-4 py-2 text-sm text-slate-600">
                  {reg.email ?? '-'}
                </td>
                <td className="px-4 py-2 text-sm text-slate-600">
                  {reg.student_code ?? '-'}
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
                <td className="px-4 py-2 text-right text-sm">
                  {(() => {
                    const regId = reg.registration_id ?? reg.id;
                    const s = (reg.registration_status ?? '').toLowerCase();
                    const busy = busyId === regId;
                    if (!regId) return null;
                    if (s === 'cancelled') {
                      return (
                        <span className="text-xs text-slate-500">—</span>
                      );
                    }
                    if (s === 'attended') {
                      return (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void updateStatus(regId, 'cancelled')}
                          className="rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      );
                    }
                    return (
                      <div className="inline-flex gap-2">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void updateStatus(regId, 'registered')}
                          className="rounded-md bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void updateStatus(regId, 'cancelled')}
                          className="rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void updateStatus(regId, 'cancelled')}
                          className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-200 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    );
                  })()}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
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

