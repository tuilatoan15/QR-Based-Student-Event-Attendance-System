import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  PlusCircle,
  QrCode,
  ClipboardCheck,
  Users,
} from 'lucide-react';

type NavItem = {
  to: string;
  label: string;
  end?: boolean;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', end: true, icon: <LayoutDashboard size={18} /> },
  { to: '/events', label: 'Events', icon: <Calendar size={18} /> },
  { to: '/events/create', label: 'Create Event', icon: <PlusCircle size={18} /> },
  { to: '/qr-scanner', label: 'QR Scanner', icon: <QrCode size={18} /> },
  { to: '/attendance', label: 'Attendance', icon: <ClipboardCheck size={18} /> },
  { to: '/users', label: 'Users', icon: <Users size={18} /> },
];

const Sidebar: React.FC = () => {
  const base =
    'flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition';

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-[260px] flex-col bg-white border-r border-gray-200 lg:flex">
      <div className="h-16 px-4 flex items-center border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
            <QrCode size={20} />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-gray-900">
              QR Event Admin
            </div>
            <div className="text-xs text-gray-500">Attendance System</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1 text-gray-700">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              [
                base,
                isActive
                  ? 'bg-primarySoft text-primary'
                  : 'text-gray-600 hover:bg-primarySoft hover:text-primary',
              ].join(' ')
            }
          >
            <span className="text-gray-500">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-4 pb-5">
        <div className="rounded-2xl bg-primarySoft p-3 text-xs text-gray-700">
          Tip:{' '}
          <span className="font-semibold text-primary">QR Scanner</span> helps
          speed up check-ins.
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

