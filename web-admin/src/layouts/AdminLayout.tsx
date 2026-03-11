import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass =
    'block px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800 hover:text-white';

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col">
        <div className="px-4 py-4 text-lg font-semibold border-b border-slate-800">
          QR Event Admin
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `${navLinkClass} ${isActive ? 'bg-slate-800' : ''}`
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/events"
            className={({ isActive }) =>
              `${navLinkClass} ${isActive ? 'bg-slate-800' : ''}`
            }
          >
            Events
          </NavLink>
          <NavLink
            to="/events/create"
            className={({ isActive }) =>
              `${navLinkClass} ${isActive ? 'bg-slate-800' : ''}`
            }
          >
            Create Event
          </NavLink>
          <NavLink
            to="/qr-scanner"
            className={({ isActive }) =>
              `${navLinkClass} ${isActive ? 'bg-slate-800' : ''}`
            }
          >
            QR Scanner
          </NavLink>
          <NavLink
            to="/events"
            className={({ isActive }) =>
              `${navLinkClass} ${isActive ? 'bg-slate-800' : ''}`
            }
          >
            Attendance history
          </NavLink>
        </nav>
        <button
          onClick={handleLogout}
          className="m-4 rounded-md bg-red-500 px-3 py-2 text-sm font-medium hover:bg-red-600"
        >
          Logout
        </button>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-white px-6 py-3">
          <h1 className="text-lg font-semibold text-slate-800">
            QR-Based Student Event Attendance
          </h1>
          <div className="text-sm text-slate-600">
            {user ? `Logged in as ${user.full_name} (${user.role})` : ''}
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

