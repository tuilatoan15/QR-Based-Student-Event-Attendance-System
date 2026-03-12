import React from 'react';

type StatCardProps = {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  subtext?: string;
};

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, subtext }) => {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-slate-600">{title}</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            {value}
          </div>
          {subtext ? (
            <div className="mt-1 text-xs text-slate-500">{subtext}</div>
          ) : null}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-lg">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;

