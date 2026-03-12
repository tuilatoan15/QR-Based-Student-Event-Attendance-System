import React, { useEffect, useMemo, useState } from 'react';
import { usersApi, type AdminUser } from '../api/usersApi';
import { notifySuccess } from '../utils/notify';
import { Search, Shield, UserCog } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            Users
          </h2>
          <div className="mt-1 text-sm text-gray-600">
            Manage roles and account status
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-80">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search name, email, student code…"
              className="w-full rounded-lg border border-gray-200 bg-white px-10 py-2 text-sm text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => void onApplySearch()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600"
          >
            Search
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                User
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Role
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                Status
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => {
              const busy = busyUserId === u.id;
              return (
                <tr key={u.id} className="hover:bg-primarySoft transition">
                  <td className="px-5 py-3 text-sm text-gray-900">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 text-gray-400">
                        <UserCog size={18} />
                      </div>
                      <div>
                        <div className="font-semibold">{u.full_name}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                        {u.student_code && (
                          <div className="text-xs text-gray-500">
                            {u.student_code}
                          </div>
                        )}
                      </div>
                    </div>
                    {u.student_code && (
                      <div className="text-xs text-gray-500">{u.student_code}</div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-700">
                    <select
                      className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
                  <td className="px-5 py-3 text-sm">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        u.is_active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Shield size={14} />
                      {u.is_active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-sm">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onToggleActive(u.id, !u.is_active)}
                      className={`rounded-md px-3 py-1 text-sm font-semibold text-white transition ${
                        u.is_active
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-emerald-600 hover:bg-emerald-700'
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
                  className="px-5 py-10 text-center text-sm text-gray-500"
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Page {page}
          {totalPages != null ? ` / ${totalPages}` : ''}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void onPrev()}
            disabled={page <= 1}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm ring-1 ring-gray-200 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => void onNext()}
            disabled={totalPages != null ? page >= totalPages : false}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default UsersPage;

