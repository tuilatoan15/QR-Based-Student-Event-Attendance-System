import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  {
    to: '/', end: true,
    label: 'Dashboard',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={18} height={18}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  },
  {
    to: '/events',
    label: 'Sự kiện',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={18} height={18}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  },
  {
    to: '/events/create',
    label: 'Tạo sự kiện',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={18} height={18}><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>,
  },
  {
    to: '/qr-scanner',
    label: 'Quét QR',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={18} height={18}><path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/><rect x="7" y="7" width="4" height="4" rx="0.5"/><rect x="13" y="7" width="4" height="4" rx="0.5"/><rect x="7" y="13" width="4" height="4" rx="0.5"/><path d="M13 15h4v2M15 13h2"/></svg>,
  },
  {
    to: '/attendance',
    label: 'Điểm danh',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={18} height={18}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>,
  },
  {
    to: '/users',
    label: 'Người dùng',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={18} height={18}><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/><path d="M16 3.13a4 4 0 010 7.75M21 21v-2a4 4 0 00-3-3.87"/></svg>,
  },
];

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const currentNav = NAV_ITEMS.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );

  const initials = user?.full_name
    ? user.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .al-root *{box-sizing:border-box;}
        .al-root{
          display:flex;min-height:100vh;
          font-family:'Inter',system-ui,sans-serif;
          background:#f0f7ff;
        }

        /* SIDEBAR */
        .al-sidebar{
          width:${collapsed ? '64px' : '230px'};
          flex-shrink:0;
          background:#fff;
          border-right:1px solid #e0eeff;
          display:flex;flex-direction:column;
          position:sticky;top:0;height:100vh;
          overflow:hidden;
          transition:width .2s cubic-bezier(.4,0,.2,1);
          box-shadow:2px 0 12px rgba(14,165,233,0.06);
          z-index:40;
        }

        /* Logo row */
        .al-logo{
          display:flex;align-items:center;gap:10px;
          padding:17px 14px 15px;
          border-bottom:1px solid #e0eeff;
          min-height:60px;
        }
        .al-logo-icon{
          width:90px;height:90px;flex-shrink:0;
          background:linear-gradient(135deg,#38bdf8,#0284c7);
          border-radius:50%;display:flex;align-items:center;
          justify-content:center;
          box-shadow:0 2px 8px rgba(14,165,233,0.35);
        }
        .al-logo-text{
          font-size:14.5px;font-weight:700;color:#0f172a;
          white-space:nowrap;flex:1;letter-spacing:-0.3px;
        }
        .al-toggle{
          margin-left:auto;width:26px;height:26px;flex-shrink:0;
          display:flex;align-items:center;justify-content:center;
          border-radius:6px;border:none;background:transparent;
          color:#94a3b8;cursor:pointer;transition:all .15s;
        }
        .al-toggle:hover{background:#f0f7ff;color:#0284c7;}

        /* Nav */
        .al-nav{
          flex:1;padding:10px 8px;display:flex;
          flex-direction:column;gap:2px;
          overflow-y:auto;overflow-x:hidden;scrollbar-width:none;
        }
        .al-nav::-webkit-scrollbar{display:none;}
        .al-nav-item{
          display:flex;align-items:center;gap:10px;
          padding:9px 10px;border-radius:8px;
          color:#64748b;text-decoration:none;
          font-size:13.5px;font-weight:500;
          transition:all .15s;white-space:nowrap;
          position:relative;overflow:hidden;
        }
        .al-nav-item:hover{background:#f0f7ff;color:#0284c7;}
        .al-nav-item.active-nav{
          background:#eff6ff;color:#0284c7;font-weight:600;
        }
        .al-nav-item.active-nav::before{
          content:'';position:absolute;left:0;top:50%;
          transform:translateY(-50%);width:3px;height:60%;
          background:#0284c7;border-radius:0 3px 3px 0;
        }
        .al-nav-icon{flex-shrink:0;}
        .al-nav-label{flex:1;overflow:hidden;text-overflow:ellipsis;}

        /* Footer */
        .al-footer{
          padding:10px 8px;border-top:1px solid #e0eeff;
          display:flex;flex-direction:column;gap:6px;
        }
        .al-user{
          display:flex;align-items:center;gap:9px;
          padding:8px 10px;border-radius:8px;background:#f8fbff;
        }
        .al-avatar{
          width:30px;height:30px;border-radius:8px;flex-shrink:0;
          background:linear-gradient(135deg,#38bdf8,#0284c7);
          color:#fff;font-size:11px;font-weight:700;
          display:flex;align-items:center;justify-content:center;
          letter-spacing:.5px;
        }
        .al-user-name{
          font-size:12.5px;font-weight:600;color:#0f172a;
          white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
        }
        .al-user-role{font-size:11px;color:#94a3b8;text-transform:capitalize;}
        .al-logout{
          display:flex;align-items:center;gap:10px;
          padding:8px 10px;border-radius:8px;
          color:#94a3b8;font-size:13.5px;font-weight:500;
          background:transparent;border:none;cursor:pointer;
          width:100%;transition:all .15s;white-space:nowrap;
        }
        .al-logout:hover{background:#fff1f2;color:#e11d48;}

        /* MAIN */
        .al-main{flex:1;display:flex;flex-direction:column;min-width:0;}

        /* TOPBAR */
        .al-topbar{
          height:60px;background:#fff;border-bottom:1px solid #e0eeff;
          display:flex;align-items:center;justify-content:space-between;
          padding:0 24px;position:sticky;top:0;z-index:30;flex-shrink:0;
          box-shadow:0 1px 6px rgba(14,165,233,0.07);
        }
        .al-page-title{font-size:16px;font-weight:700;color:#0f172a;letter-spacing:-0.3px;}
        .al-topbar-right{display:flex;align-items:center;gap:12px;}
        .al-status{
          display:flex;align-items:center;gap:6px;font-size:12px;
          color:#64748b;padding:5px 11px;border-radius:20px;
          background:#f0f7ff;border:1px solid #e0eeff;
        }
        .al-dot{
          width:7px;height:7px;border-radius:50%;
          background:#22c55e;box-shadow:0 0 6px #22c55e;
          animation:al-pulse 2s infinite;
        }
        @keyframes al-pulse{0%,100%{opacity:1}50%{opacity:.4}}
        .al-topbar-user{
          display:flex;align-items:center;gap:8px;
          padding:5px 13px 5px 6px;border-radius:20px;
          background:#f0f7ff;border:1px solid #e0eeff;
        }
        .al-topbar-av{
          width:26px;height:26px;border-radius:7px;
          background:linear-gradient(135deg,#38bdf8,#0284c7);
          color:#fff;font-size:10.5px;font-weight:700;
          display:flex;align-items:center;justify-content:center;
        }
        .al-topbar-name{
          font-size:13px;font-weight:500;color:#374151;
          max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
        }

        /* PAGE */
        .al-page{flex:1;padding:28px;overflow-y:auto;}

        @media(max-width:768px){
          .al-status{display:none;}
          .al-page{padding:16px;}
          .al-topbar{padding:0 16px;}
        }
      `}</style>

      <div className="al-root">
        {/* Sidebar */}
        <aside className="al-sidebar">
          <div className="al-logo">
            <div className="al-logo-icon">
              <img src="/assets/logo/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            </div>
            {!collapsed && <span className="al-logo-text">QR Events</span>}
            <button className="al-toggle" onClick={() => setCollapsed(!collapsed)} title={collapsed ? 'Mở rộng' : 'Thu gọn'}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={14} height={14}
                style={{transform: collapsed ? 'rotate(180deg)' : 'none', transition:'transform .2s'}}>
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
          </div>

          <nav className="al-nav">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) => `al-nav-item${isActive ? ' active-nav' : ''}`}
              >
                <span className="al-nav-icon">{item.icon}</span>
                {!collapsed && <span className="al-nav-label">{item.label}</span>}
              </NavLink>
            ))}
          </nav>

          <div className="al-footer">
            {!collapsed && (
              <div className="al-user">
                <div className="al-avatar">{initials}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div className="al-user-name">{user?.full_name ?? 'Admin'}</div>
                  <div className="al-user-role">{user?.role ?? 'admin'}</div>
                </div>
              </div>
            )}
            <button className="al-logout" onClick={handleLogout} title="Đăng xuất">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} width={18} height={18}>
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              {!collapsed && <span>Đăng xuất</span>}
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="al-main">
          <header className="al-topbar">
            <h1 className="al-page-title">{currentNav?.label ?? 'Admin'}</h1>
            <div className="al-topbar-right">
              <div className="al-status">
                <span className="al-dot"/>
                Hệ thống hoạt động
              </div>
              <div className="al-topbar-user">
                <div className="al-topbar-av">{initials}</div>
                <span className="al-topbar-name">{user?.full_name ?? 'Admin'}</span>
              </div>
            </div>
          </header>
          <main className="al-page">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
};

export default AdminLayout;