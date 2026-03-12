import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { eventApi, type Event } from '../api/eventApi';
import { exportToCsv, exportToXlsx } from '../utils/exporters';

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [event, setEvent] = useState<Event | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const [evRes, partRes] = await Promise.all([
          eventApi.getEvent(Number(id)),
          eventApi.getEventRegistrations(Number(id)),
        ]);

        const evData = evRes.data.data ?? evRes.data;
        const partData = partRes.data.data ?? partRes.data;

        setEvent(evData as Event);
        setParticipants(Array.isArray(partData) ? partData : []);
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            'Unable to load event details. Please try again.',
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  const stats = useMemo(() => {
    const total = participants.length;

    const attended = participants.filter(
      (p) =>
        String(p.registration_status ?? '').toLowerCase() === 'checked_in' ||
        !!p.checkin_time,
    ).length;

    const cancelled = participants.filter(
      (p) =>
        String(p.registration_status ?? '').toLowerCase() === 'cancelled',
    ).length;

    return { total, attended, cancelled };
  }, [participants]);

  const exportParticipantsCsv = () => {
    const header = [
      'Registration ID',
      'Student Name',
      'Email',
      'Student Code',
      'Status',
      'Check-in Time',
    ];

    const rows = participants.map((p) => [
      p.registration_id ?? '',
      p.student_name ?? '',
      p.email ?? '',
      p.student_code ?? '',
      p.registration_status ?? '',
      p.checkin_time ? new Date(p.checkin_time).toLocaleString() : '',
    ]);

    exportToCsv(`event-${event?.id}-participants.csv`, header, rows);
  };

  const exportParticipantsXlsx = () => {
    const header = [
      'Registration ID',
      'Student Name',
      'Email',
      'Student Code',
      'Status',
      'Check-in Time',
    ];

    const rows = participants.map((p) => [
      p.registration_id ?? '',
      p.student_name ?? '',
      p.email ?? '',
      p.student_code ?? '',
      p.registration_status ?? '',
      p.checkin_time ? new Date(p.checkin_time).toLocaleString() : '',
    ]);

    exportToXlsx(
      `event-${event?.id}-participants.xlsx`,
      'Participants',
      header,
      rows,
    );
  };

  if (loading) return <div>Loading event...</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!event) return <div>Event not found.</div>;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-800">
          Event Details
        </h2>

        <div className="space-x-2">

          <Link
            to={`/events/${event.id}/edit`}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Edit
          </Link>

          <Link
            to={`/events/${event.id}/participants`}
            className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-200"
          >
            Participants
          </Link>

          <Link
            to={`/attendance/event/${event.id}`}
            className="rounded-md bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-200"
          >
            Attendance
          </Link>

        </div>
      </div>

      {/* Event Info */}
      <div className="grid gap-4 lg:grid-cols-3">

        <div className="lg:col-span-3 rounded-lg bg-white p-4 shadow space-y-3">

          <div>
            <span className="text-sm font-semibold text-slate-500">
              Title
            </span>
            <div className="text-base font-medium text-slate-900">
              {event.title}
            </div>
          </div>

          {event.description && (
            <div>
              <span className="text-sm font-semibold text-slate-500">
                Description
              </span>
              <div className="text-sm text-slate-700">
                {event.description}
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">

            <div>
              <span className="text-sm font-semibold text-slate-500">
                Location
              </span>
              <div className="text-sm text-slate-700">
                {event.location}
              </div>
            </div>

            <div>
              <span className="text-sm font-semibold text-slate-500">
                Max participants
              </span>
              <div className="text-sm text-slate-700">
                {event.max_participants}
              </div>
            </div>

            <div>
              <span className="text-sm font-semibold text-slate-500">
                Start time
              </span>
              <div className="text-sm text-slate-700">
                {new Date(event.start_time).toLocaleString()}
              </div>
            </div>

            <div>
              <span className="text-sm font-semibold text-slate-500">
                End time
              </span>
              <div className="text-sm text-slate-700">
                {new Date(event.end_time).toLocaleString()}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Participants */}
      <div className="rounded-lg bg-white p-4 shadow space-y-3">

        <div className="flex flex-wrap items-center justify-between gap-3">

          <div>
            <div className="text-base font-semibold text-slate-900">
              Participants
            </div>

            <div className="text-sm text-slate-500">
              Total: <span className="font-medium">{stats.total}</span> ·
              Attended: <span className="font-medium">{stats.attended}</span> ·
              Cancelled: <span className="font-medium">{stats.cancelled}</span>
            </div>
          </div>

          <div className="flex gap-2">

            <button
              onClick={exportParticipantsCsv}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-800"
            >
              Export CSV
            </button>

            <button
              onClick={exportParticipantsXlsx}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
            >
              Export Excel
            </button>

            <Link
              to={`/qr-scanner?eventId=${event.id}`}
              className="rounded-md bg-emerald-100 px-3 py-1.5 text-sm text-emerald-800 hover:bg-emerald-200"
            >
              Open Scanner
            </Link>

          </div>

        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">

          <table className="min-w-full divide-y divide-slate-200">

            <thead className="bg-slate-50">
              <tr>

                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                  Student
                </th>

                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                  Email
                </th>

                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                  Status
                </th>

                <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                  Check-in time
                </th>

              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">

              {participants.map((p, idx) => (
                <tr key={p.registration_id ?? idx}>

                  <td className="px-4 py-2 text-sm text-slate-800">
                    {p.student_name ?? '-'}
                    {p.student_code && (
                      <div className="text-xs text-slate-500">
                        {p.student_code}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-2 text-sm text-slate-600">
                    {p.email ?? '-'}
                  </td>

                  <td className="px-4 py-2 text-sm text-slate-600">
                    {p.registration_status ?? '-'}
                  </td>

                  <td className="px-4 py-2 text-sm text-slate-600">
                    {p.checkin_time
                      ? new Date(p.checkin_time).toLocaleString()
                      : '-'}
                  </td>

                </tr>
              ))}

              {participants.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-6 text-center text-sm text-slate-500"
                  >
                    No participants yet.
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
};

export default EventDetailPage;

