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
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Event Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Location
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Registered
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Checked-in
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 text-sm text-slate-900">
                <div className="font-medium">{r.title}</div>
                <div className="text-xs text-slate-500">#{r.id}</div>
              </td>
              <td className="px-4 py-3 text-sm text-slate-700">{r.location}</td>
              <td className="px-4 py-3 text-sm text-slate-700">
                {r.start_time ? new Date(r.start_time).toLocaleString() : '-'}
              </td>
              <td className="px-4 py-3 text-sm text-slate-700">
                {r.registered}
              </td>
              <td className="px-4 py-3 text-sm text-slate-700">
                {r.checked_in}
              </td>
              <td className="px-4 py-3 text-right text-sm">
                <div className="inline-flex flex-wrap justify-end gap-2">
                  <Link
                    to={`/events/${r.id}`}
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    View
                  </Link>
                  <Link
                    to={`/qr-scanner?eventId=${r.id}`}
                    className="rounded-md bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-200"
                  >
                    Scan QR
                  </Link>
                  <Link
                    to={`/events/${r.id}/edit`}
                    className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    Edit
                  </Link>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-8 text-center text-sm text-slate-500"
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

export default DashboardEventTable;

