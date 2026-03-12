import React from 'react';
import { Search, LogOut, UserCircle2 } from 'lucide-react';

type TopbarProps = {
  userLabel: string;
  onLogout: () => void;
};

const Topbar: React.FC<TopbarProps> = ({ userLabel, onLogout }) => {
  return (
    <header className="sticky top-0 z-10 h-16 bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="hidden w-full max-w-md lg:block">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search…"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700 sm:flex">
            <UserCircle2 size={18} className="text-gray-500" />
            <span className="max-w-[260px] truncate">{userLabel}</span>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Topbar;

