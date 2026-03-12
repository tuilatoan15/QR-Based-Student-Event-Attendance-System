import React, { useEffect, useMemo, useState } from 'react';
import { QrReader } from 'react-qr-reader';
import { attendanceApi, type AttendanceListRecord } from '../api/attendanceApi';
import { eventApi, type Event } from '../api/eventApi';
import { exportToCsv, exportToXlsx } from '../utils/exporters';
import { notifySuccess } from '../utils/notify';

type ScanResult = {
  at: string;
  ok: boolean;
  message: string;
};

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
      } finally {
        setLoading(false);
      }
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
    } finally {
      setLoading(false);
    }
  };

  const onManualCheckin = async () => {
    const id = parseInt(manualRegId, 10);
    if (!Number.isInteger(id) || id <= 0) return;
    const res = await attendanceApi.manualCheckIn(id);
    notifySuccess(res.data?.message || 'Manual check-in successful');
    setManualRegId('');
    await reload();
  };

  const onExportCsv = () => {
    const header = [
      'Student Name',
      'Email',
      'Student Code',
      'Event',
      'Check-in Time',
    ];
    const rows = filtered.map((r) => [
      r.student_name,
      r.email,
      r.student_code ?? '',
      r.event_title,
      r.check_in_time ? new Date(r.check_in_time).toLocaleString() : '',
    ]);
    exportToCsv('attendance-report.csv', header, rows);
  };

  const onExportXlsx = () => {
    const header = [
      'Student Name',
      'Email',
      'Student Code',
      'Event',
      'Check-in Time',
    ];
    const rows = filtered.map((r) => [
      r.student_name,
      r.email,
      r.student_code ?? '',
      r.event_title,
      r.check_in_time ? new Date(r.check_in_time).toLocaleString() : '',
    ]);
    exportToXlsx('attendance-report.xlsx', 'Attendance', header, rows);
  };

  const handleScan = async (text: string) => {
    if (processingScan) return;
    setProcessingScan(true);
    try {
      const res = await attendanceApi.checkIn(text);
      const msg = res.data?.message || 'Check-in successful';
      setScanResults((prev) => [
        { at: new Date().toISOString(), ok: true, message: msg },
        ...prev,
      ].slice(0, 8));
      notifySuccess(msg);
      await reload();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        'Check-in failed. Please verify the QR code.';
      setScanResults((prev) => [
        { at: new Date().toISOString(), ok: false, message: msg },
        ...prev,
      ].slice(0, 8));
    } finally {
      setProcessingScan(false);
    }
  };

  if (loading) return <div>Loading attendance...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-800">Attendance</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onExportCsv}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={onExportXlsx}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Export Excel
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-white p-4 shadow">
            <select
              className="rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={eventId}
              onChange={(e) => {
                const v = e.target.value;
                setEventId(v === 'all' ? 'all' : Number(v));
              }}
            >
              <option value="all">All events</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Search student/event..."
              className="w-64 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              type="button"
              onClick={() => void reload()}
              className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-200"
            >
              Apply
            </button>
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
                    Check-in time
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Registration
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((r) => (
                  <tr key={r.attendance_id}>
                    <td className="px-4 py-2 text-sm text-slate-800">
                      <div className="font-medium">{r.student_name}</div>
                      <div className="text-xs text-slate-500">{r.email}</div>
                    </td>
                    <td className="px-4 py-2 text-sm text-slate-700">
                      {r.event_title}
                    </td>
                    <td className="px-4 py-2 text-sm text-slate-700">
                      {r.check_in_time
                        ? new Date(r.check_in_time).toLocaleString()
                        : '-'}
                    </td>
                    <td className="px-4 py-2 text-sm text-slate-700">
                      {r.registration_status}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-sm text-slate-500"
                    >
                      No attendance records.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg bg-white p-4 shadow space-y-2">
            <div className="text-sm font-semibold text-slate-800">
              Manual check-in
            </div>
            <div className="text-xs text-slate-500">
              Enter a <span className="font-medium">registration ID</span> to
              mark attended.
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Registration ID"
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={manualRegId}
                onChange={(e) => setManualRegId(e.target.value)}
              />
              <button
                type="button"
                onClick={() => void onManualCheckin()}
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Check-in
              </button>
            </div>
          </div>

          <div className="rounded-lg bg-white p-4 shadow space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-800">
                QR scan
              </div>
              <button
                type="button"
                onClick={() => setScanning((v) => !v)}
                className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-200"
              >
                {scanning ? 'Stop' : 'Start'}
              </button>
            </div>
            {scanning && (
              <div className="rounded-md border border-slate-200 p-2">
                <QrReader
                  constraints={{ facingMode: 'environment' }}
                  onResult={(result) => {
                    const text = result?.getText?.();
                    if (text) void handleScan(text);
                  }}
                  containerStyle={{ width: '100%' }}
                />
              </div>
            )}

            <div className="space-y-2">
              {scanResults.length === 0 && (
                <div className="text-sm text-slate-500">
                  No scan results yet.
                </div>
              )}
              {scanResults.map((r, idx) => (
                <div
                  key={`${r.at}-${idx}`}
                  className={`rounded-md px-3 py-2 text-sm ${
                    r.ok
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  <div className="font-medium">{r.message}</div>
                  <div className="text-xs opacity-80">
                    {new Date(r.at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            {processingScan && (
              <div className="text-xs text-slate-500">Processing scan…</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;

