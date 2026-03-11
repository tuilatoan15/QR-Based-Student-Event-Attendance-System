import React from 'react';
import { Link } from 'react-router-dom';
import type { Event } from '../api/eventApi';

type Props = {
  events: Event[];
  onDelete: (id: number) => void;
};

const EventTable: React.FC<Props> = ({ events, onDelete }) => {
  return (
    <div className="overflow-x-auto rounded-lg bg-white shadow">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Title
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Location
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Start
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              End
            </th>
            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Max Participants
            </th>
            <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {events.map((event) => (
            <tr key={event.id} className="hover:bg-slate-50">
              <td className="px-4 py-2 text-sm text-slate-800">
                {event.title}
              </td>
              <td className="px-4 py-2 text-sm text-slate-600">
                {event.location}
              </td>
              <td className="px-4 py-2 text-sm text-slate-600">
                {new Date(event.start_time).toLocaleString()}
              </td>
              <td className="px-4 py-2 text-sm text-slate-600">
                {new Date(event.end_time).toLocaleString()}
              </td>
              <td className="px-4 py-2 text-sm text-slate-600">
                {event.max_participants}
              </td>
              <td className="space-x-2 px-4 py-2 text-right text-sm">
                <Link
                  to={`/events/${event.id}/edit`}
                  className="rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                >
                  Edit
                </Link>
                <Link
                  to={`/events/${event.id}/registrations`}
                  className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-200"
                >
                  Registrations
                </Link>
                <Link
                  to={`/qr-scanner?eventId=${event.id}`}
                  className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-200"
                >
                  Scan QR
                </Link>
                <button
                  onClick={() => onDelete(event.id)}
                  className="rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {events.length === 0 && (
            <tr>
              <td
                className="px-4 py-4 text-center text-sm text-slate-500"
                colSpan={6}
              >
                No events found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EventTable;

