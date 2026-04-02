import React from 'react';

type PageLoadingProps = {
  message?: string;
  minHeight?: number;
};

export const PageLoading: React.FC<PageLoadingProps> = ({
  message = 'Dang tai du lieu...',
  minHeight = 260,
}) => (
  <>
    <style>{`
      .ps-loading{
        display:flex;
        align-items:center;
        justify-content:center;
        min-height:var(--ps-min-height);
        gap:12px;
        color:#94a3b8;
        font-size:13px;
        border:1px solid #e0eeff;
        border-radius:14px;
        background:#fff;
        box-shadow:0 1px 4px rgba(14,165,233,.06),0 4px 16px rgba(14,165,233,.05);
      }
      .ps-spin{
        width:20px;
        height:20px;
        border:2px solid #e0eeff;
        border-top-color:#0284c7;
        border-radius:50%;
        animation:ps-spin .7s linear infinite;
      }
      @keyframes ps-spin{to{transform:rotate(360deg)}}
    `}</style>
    <div className="ps-loading" style={{ ['--ps-min-height' as string]: `${minHeight}px` }}>
      <div className="ps-spin" />
      <span>{message}</span>
    </div>
  </>
);

type PageErrorProps = {
  message: string;
};

export const PageError: React.FC<PageErrorProps> = ({ message }) => (
  <div
    style={{
      background: '#fff1f2',
      border: '1px solid #fecaca',
      borderRadius: 12,
      padding: '14px 18px',
      color: '#be123c',
      fontSize: 13,
    }}
  >
    {message}
  </div>
);
