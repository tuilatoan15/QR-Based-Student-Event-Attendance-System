import React, { useEffect, useMemo, useState } from 'react';
import { usersApi, type AdminUser } from '../api/usersApi';
import { notifySuccess } from '../utils/notify';

const ROLES = ['admin', 'organizer', 'student'] as const;

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  const load = async (nextPage = page) => {
    setLoading(true);
    try {
      const res = await usersApi.listUsers({
        page: nextPage,
        limit: 20,
        search: search.trim() ? search.trim() : undefined,
      });
      const payload = res.data?.data ?? res.data;
      const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
      const pagination = res.data?.pagination;
      setUsers(items);
      setTotal(pagination?.total ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(1);
  }, []);

  const totalPages = useMemo(() => {
    if (total == null) return null;
    return Math.max(1, Math.ceil(total / 20));
  }, [total]);

  const onApplySearch = async () => {
    setPage(1);
    await load(1);
  };

  const onChangeRole = async (userId: number, role: string) => {
    setBusyUserId(userId);
    try {
      const res = await usersApi.updateRole(userId, role);
      notifySuccess(res.data?.message || 'Role updated');
      await load(page);
    } finally {
      setBusyUserId(null);
    }
  };

  const onToggleActive = async (userId: number, isActive: boolean) => {
    setBusyUserId(userId);
    try {
      const res = await usersApi.setActive(userId, isActive);
      notifySuccess(res.data?.message || 'User updated');
      await load(page);
    } finally {
      setBusyUserId(null);
    }
  };

  const onPrev = async () => {
    const next = Math.max(1, page - 1);
    setPage(next);
    await load(next);
  };

  const onNext = async () => {
    const next = page + 1;
    if (totalPages != null && next > totalPages) return;
    setPage(next);
    await load(next);
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-slate-800">Users</h2>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search name/email/student code…"
            className="w-72 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            onClick={() => void onApplySearch()}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Search
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                User
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Role
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
              </th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => {
              const busy = busyUserId === u.id;
              return (
                <tr key={u.id}>
                  <td className="px-4 py-2 text-sm text-slate-800">
                    <div className="font-medium">{u.full_name}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                    {u.student_code && (
                      <div className="text-xs text-slate-500">
                        {u.student_code}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm text-slate-700">
                    <select
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      value={u.role_name}
                      disabled={busy}
                      onChange={(e) => void onChangeRole(u.id, e.target.value)}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.is_active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {u.is_active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right text-sm">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onToggleActive(u.id, !u.is_active)}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                        u.is_active
                          ? 'bg-red-50 text-red-700 hover:bg-red-100'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-center text-sm text-slate-500"
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">
          Page {page}
          {totalPages != null ? ` / ${totalPages}` : ''}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void onPrev()}
            disabled={page <= 1}
            className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-200 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => void onNext()}
            disabled={totalPages != null ? page >= totalPages : false}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;

