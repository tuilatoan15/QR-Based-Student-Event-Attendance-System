import React from 'react';

type StatCardProps = {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  subtext?: string;
  onClick?: () => void;
};

const CARD_THEMES = [
  { bg: '#eff6ff', accent: '#2563eb', iconBg: '#dbeafe', iconColor: '#1d4ed8' },
  { bg: '#f0fdf4', accent: '#16a34a', iconBg: '#dcfce7', iconColor: '#15803d' },
  { bg: '#fff7ed', accent: '#ea580c', iconBg: '#ffedd5', iconColor: '#c2410c' },
  { bg: '#fdf4ff', accent: '#9333ea', iconBg: '#f3e8ff', iconColor: '#7e22ce' },
];

let cardIndex = 0;

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, subtext, onClick }) => {
  // Pick theme by cycling — wrap in useMemo if needed
  const theme = CARD_THEMES[cardIndex++ % CARD_THEMES.length];

  return (
    <>
      <style>{`
        .sc-wrap {
          background: #fff;
          border-radius: 14px;
          padding: 22px 22px 18px;
          border: 1px solid #e0eeff;
          box-shadow: 0 1px 4px rgba(14,165,233,0.06), 0 4px 16px rgba(14,165,233,0.05);
          display: flex;
          flex-direction: column;
          gap: 14px;
          transition: box-shadow .18s, transform .18s;
          cursor: ${onClick ? 'pointer' : 'default'};
          user-select: none;
        }
        .sc-wrap:hover {
          box-shadow: 0 4px 20px rgba(14,165,233,0.14);
          transform: translateY(-2px);
        }
        .sc-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }
        .sc-title {
          font-size: 11.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: .06em;
          color: #64748b;
          margin-bottom: 6px;
        }
        .sc-value {
          font-size: 32px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -1.5px;
          line-height: 1;
        }
        .sc-sub {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 5px;
        }
        .sc-icon {
          width: 42px;
          height: 42px;
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          flex-shrink: 0;
        }
        .sc-bar {
          height: 3px;
          border-radius: 2px;
          background: #f1f5f9;
          overflow: hidden;
        }
        .sc-bar-fill {
          height: 100%;
          border-radius: 2px;
          width: 60%;
        }
      `}</style>
      <div className="sc-wrap" onClick={onClick}>
        <div className="sc-top">
          <div>
            <div className="sc-title">{title}</div>
            <div className="sc-value">{value}</div>
            {subtext && <div className="sc-sub">{subtext}</div>}
          </div>
          <div className="sc-icon" style={{ background: theme.iconBg }}>
            {icon}
          </div>
        </div>
        <div className="sc-bar">
          <div className="sc-bar-fill" style={{ background: theme.accent }} />
        </div>
      </div>
    </>
  );
};

export default StatCard;