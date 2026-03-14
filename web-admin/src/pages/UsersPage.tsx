import React, { useEffect, useMemo, useState } from 'react';
import { usersApi, type AdminUser } from '../api/usersApi';
import { notifySuccess } from '../utils/notify';
import { Search, Shield, UserCog } from 'lucide-react';

const ROLES = ['admin', 'organizer', 'student'] as const;

const ROLE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  admin:     { bg: '#fdf4ff', color: '#7e22ce', label: 'Admin' },
  organizer: { bg: '#eff6ff', color: '#1d4ed8', label: 'Organizer' },
  student:   { bg: '#f0fdf4', color: '#15803d', label: 'Student' },
};

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
      const res = await usersApi.listUsers({ page: nextPage, limit: 20, search: search.trim() || undefined });
      const payload = res.data?.data ?? res.data;
      const items = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
      setUsers(items);
      setTotal(res.data?.pagination?.total ?? null);
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(1); }, []);

  const totalPages = useMemo(() => total == null ? null : Math.max(1, Math.ceil(total / 20)), [total]);

  const onApplySearch = async () => { setPage(1); await load(1); };
  const onChangeRole = async (userId: number, role: string) => {
    setBusyUserId(userId);
    try { const res = await usersApi.updateRole(userId, role); notifySuccess(res.data?.message || 'Đã cập nhật vai trò'); await load(page); }
    finally { setBusyUserId(null); }
  };
  const onToggleActive = async (userId: number, isActive: boolean) => {
    setBusyUserId(userId);
    try { const res = await usersApi.setActive(userId, isActive); notifySuccess(res.data?.message || 'Đã cập nhật trạng thái'); await load(page); }
    finally { setBusyUserId(null); }
  };
  const onPrev = async () => { const n=Math.max(1,page-1); setPage(n); await load(n); };
  const onNext = async () => { const n=page+1; if(totalPages!=null&&n>totalPages)return; setPage(n); await load(n); };

  const initials = (name: string) => name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();

  if (loading && users.length === 0) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:300,gap:12,color:'#94a3b8',fontSize:13}}>
      <div style={{width:20,height:20,border:'2px solid #e0eeff',borderTopColor:'#0284c7',borderRadius:'50%',animation:'up-spin .7s linear infinite'}}/>
      <style>{`@keyframes up-spin{to{transform:rotate(360deg)}}`}</style>
      Đang tải danh sách người dùng...
    </div>
  );

  return (
    <>
      <style>{`
        .up-header{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:14px;margin-bottom:22px;}
        .up-title{font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-.5px;}
        .up-subtitle{font-size:13px;color:#94a3b8;margin-top:3px;}
        .up-search-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}
        .up-search-wrap{position:relative;}
        .up-search-ico{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#94a3b8;pointer-events:none;}
        .up-search-input{padding:9px 14px 9px 37px;background:#fff;border:1.5px solid #e2e8f0;border-radius:9px;font-size:13.5px;font-family:inherit;color:#0f172a;outline:none;width:280px;transition:border-color .15s,box-shadow .15s;}
        .up-search-input:focus{border-color:#0ea5e9;box-shadow:0 0 0 3px rgba(14,165,233,.15);}
        .up-search-input::placeholder{color:#cbd5e1;}
        .up-search-btn{padding:9px 18px;background:linear-gradient(135deg,#38bdf8,#0284c7);color:#fff;border:none;border-radius:9px;font-size:13.5px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;box-shadow:0 2px 8px rgba(14,165,233,.3);}
        .up-search-btn:hover{opacity:.9;}

        .up-card{background:#fff;border-radius:14px;border:1px solid #e0eeff;box-shadow:0 1px 4px rgba(14,165,233,.06),0 4px 16px rgba(14,165,233,.05);overflow:hidden;margin-bottom:16px;}
        .up-table{width:100%;border-collapse:collapse;font-size:13.5px;}
        .up-table thead tr{background:#f8fbff;border-bottom:1px solid #e0eeff;}
        .up-table thead th{padding:12px 18px;text-align:left;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;white-space:nowrap;}
        .up-table thead th:last-child{text-align:right;}
        .up-table tbody tr{border-bottom:1px solid #f1f8ff;transition:background .12s;}
        .up-table tbody tr:last-child{border-bottom:none;}
        .up-table tbody tr:hover{background:#f8fbff;}
        .up-table tbody td{padding:13px 18px;vertical-align:middle;}

        .up-user-cell{display:flex;align-items:center;gap:12px;}
        .up-avatar{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#38bdf8,#0284c7);color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;letter-spacing:.5px;}
        .up-user-name{font-weight:600;color:#0f172a;font-size:13.5px;}
        .up-user-email{font-size:12px;color:#94a3b8;margin-top:1px;}
        .up-user-code{font-size:11.5px;color:#bfdbfe;background:#eff6ff;padding:1px 7px;border-radius:4px;display:inline-block;margin-top:3px;}

        .up-role-badge{display:inline-flex;align-items:center;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:700;}
        .up-status-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;}

        .up-role-select{padding:6px 10px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:8px;font-size:13px;font-family:inherit;color:#0f172a;outline:none;cursor:pointer;transition:border-color .15s;}
        .up-role-select:focus{border-color:#0ea5e9;box-shadow:0 0 0 3px rgba(14,165,233,.15);}
        .up-role-select:disabled{opacity:.5;cursor:not-allowed;}

        .up-toggle-btn{padding:6px 14px;border:none;border-radius:8px;font-size:12.5px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .14s;}
        .up-toggle-btn:disabled{opacity:.5;cursor:not-allowed;}
        .up-toggle-deactivate{background:#fff1f2;color:#be123c;}.up-toggle-deactivate:hover:not(:disabled){background:#ffe4e6;}
        .up-toggle-activate{background:#f0fdf4;color:#15803d;}.up-toggle-activate:hover:not(:disabled){background:#dcfce7;}

        .up-empty{padding:48px 16px;text-align:center;color:#94a3b8;font-size:13.5px;}
        .up-empty-icon{font-size:32px;margin-bottom:10px;}

        .up-pagination{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;}
        .up-page-info{font-size:13px;color:#64748b;background:#f0f7ff;border:1px solid #e0eeff;padding:6px 14px;border-radius:20px;}
        .up-page-btns{display:flex;gap:8px;}
        .up-page-btn{padding:7px 18px;border-radius:8px;font-size:13.5px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .14s;border:none;}
        .up-page-btn:disabled{opacity:.45;cursor:not-allowed;}
        .up-page-btn-prev{background:#fff;border:1.5px solid #e0eeff;color:#334155;}.up-page-btn-prev:hover:not(:disabled){background:#f0f7ff;border-color:#bae6fd;}
        .up-page-btn-next{background:linear-gradient(135deg,#38bdf8,#0284c7);color:#fff;box-shadow:0 2px 8px rgba(14,165,233,.3);}.up-page-btn-next:hover:not(:disabled){opacity:.9;}
      `}</style>

      <div>
        <div className="up-header">
          <div>
            <div className="up-title">Người dùng</div>
            <div className="up-subtitle">Quản lý vai trò và trạng thái tài khoản{total!=null?` · ${total} người dùng`:''}</div>
          </div>
          <div className="up-search-row">
            <div className="up-search-wrap">
              <span className="up-search-ico"><Search size={15}/></span>
              <input
                type="text"
                placeholder="Tìm tên, email, mã SV..."
                className="up-search-input"
                value={search}
                onChange={e=>setSearch(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter')void onApplySearch();}}
              />
            </div>
            <button type="button" onClick={()=>void onApplySearch()} className="up-search-btn">Tìm kiếm</button>
          </div>
        </div>

        <div className="up-card">
          <div style={{overflowX:'auto'}}>
            <table className="up-table">
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const busy = busyUserId === u.id;
                  const roleStyle = ROLE_STYLES[u.role_name] ?? ROLE_STYLES.student;
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="up-user-cell">
                          <div className="up-avatar">{initials(u.full_name||'?')}</div>
                          <div>
                            <div className="up-user-name">{u.full_name}</div>
                            <div className="up-user-email">{u.email}</div>
                            {u.student_code && <span className="up-user-code">{u.student_code}</span>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <select
                          className="up-role-select"
                          value={u.role_name}
                          disabled={busy}
                          onChange={e=>void onChangeRole(u.id,e.target.value)}
                        >
                          {ROLES.map(r=><option key={r} value={r}>{ROLE_STYLES[r]?.label??r}</option>)}
                        </select>
                      </td>
                      <td>
                        <span
                          className="up-status-badge"
                          style={u.is_active
                            ? {background:'#f0fdf4',color:'#15803d'}
                            : {background:'#f8fafc',color:'#94a3b8'}
                          }
                        >
                          <Shield size={12}/>
                          {u.is_active ? 'Đang hoạt động' : 'Đã vô hiệu hoá'}
                        </span>
                      </td>
                      <td style={{textAlign:'right'}}>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={()=>void onToggleActive(u.id,!u.is_active)}
                          className={`up-toggle-btn ${u.is_active?'up-toggle-deactivate':'up-toggle-activate'}`}
                        >
                          {busy ? '...' : u.is_active ? 'Vô hiệu hoá' : 'Kích hoạt'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {users.length === 0 && (
                  <tr><td colSpan={4} className="up-empty">
                    <div className="up-empty-icon">👥</div>
                    Không tìm thấy người dùng
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="up-pagination">
          <span className="up-page-info">
            Trang {page}{totalPages!=null?` / ${totalPages}`:''}
            {total!=null?` · ${total} người`:''}
          </span>
          <div className="up-page-btns">
            <button type="button" onClick={()=>void onPrev()} disabled={page<=1} className="up-page-btn up-page-btn-prev">← Trước</button>
            <button type="button" onClick={()=>void onNext()} disabled={totalPages!=null?page>=totalPages:false} className="up-page-btn up-page-btn-next">Tiếp →</button>
          </div>
        </div>
      </div>
    </>
  );
};

export default UsersPage;