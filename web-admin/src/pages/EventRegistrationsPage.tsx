import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { eventApi } from '../api/eventApi';

type Registration = {
  id: number;
  full_name?: string;
  email?: string;
  registered_at?: string;
  status?: string;
};

const EventRegistrationsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) return <div>Loading registrations...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-slate-800">
        Event Registrations
      </h2>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {registrations.map((reg) => (
              <tr key={reg.id}>
                <td className="px-4 py-2 text-sm text-slate-800">
                  {reg.full_name ?? '-'}
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
                  {reg.status ?? '-'}
                </td>
              </tr>
            ))}
            {registrations.length === 0 && (
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

