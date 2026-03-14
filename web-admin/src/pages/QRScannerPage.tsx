import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QrReader } from 'react-qr-reader';
import { attendanceApi } from '../api/attendanceApi';

const QRScannerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [lastResult, setLastResult] = useState<{ message: string; isWarning?: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [scanCount, setScanCount] = useState(0);

  const eventId = searchParams.get('eventId');

  const handleScan = async (data: string | null) => {
    if (!data || processing) return;
    setProcessing(true);
    setError(null);
    setLastResult(null);
    try {
      const res = await attendanceApi.checkIn(data);
      const message = res.data?.message || 'Check-in thành công!';
      const isWarning = res.data?.data?.already_checked_in === true;
      setLastResult({ message, isWarning });
      if (!isWarning) setScanCount(c => c + 1);
    } catch (err: any) {
      const backendMessage = err?.response?.data?.message;
      setError(backendMessage || 'Check-in thất bại. Vui lòng kiểm tra mã QR.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <style>{`
        .qr-root{max-width:680px;}
        .qr-header{margin-bottom:24px;}
        .qr-title{font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-.5px;margin-bottom:4px;}
        .qr-subtitle{font-size:13px;color:#94a3b8;}
        .qr-event-badge{display:inline-flex;align-items:center;gap:7px;margin-top:10px;background:#eff6ff;border:1px solid #dbeafe;border-radius:20px;padding:5px 13px;font-size:12.5px;color:#1d4ed8;font-weight:600;}

        .qr-layout{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
        @media(max-width:600px){.qr-layout{grid-template-columns:1fr;}}

        .qr-card{background:#fff;border-radius:14px;border:1px solid #e0eeff;box-shadow:0 1px 4px rgba(14,165,233,.06),0 4px 16px rgba(14,165,233,.05);overflow:hidden;}
        .qr-card-head{padding:16px 18px 14px;border-bottom:1px solid #f1f8ff;display:flex;align-items:center;justify-content:space-between;}
        .qr-card-title{font-size:13.5px;font-weight:700;color:#0f172a;}
        .qr-card-body{padding:18px;}

        .qr-camera-wrap{border-radius:10px;overflow:hidden;border:2px solid #e0eeff;background:#f8fbff;position:relative;}
        .qr-camera-wrap video{border-radius:8px;}
        .qr-camera-overlay{position:absolute;inset:0;pointer-events:none;display:flex;align-items:center;justify-content:center;}
        .qr-scan-box{width:180px;height:180px;border:2px solid #0284c7;border-radius:12px;box-shadow:0 0 0 9999px rgba(0,0,0,0.2);}
        .qr-scan-box::before,.qr-scan-box::after{content:'';position:absolute;width:180px;height:2px;background:rgba(14,165,233,0.6);animation:qr-scan 1.8s ease-in-out infinite;}
        @keyframes qr-scan{0%,100%{top:calc(50% - 90px)}50%{top:calc(50% + 88px)}}

        .qr-processing{display:flex;align-items:center;gap:8px;padding:10px 14px;background:#eff6ff;border-radius:9px;font-size:13px;color:#1d4ed8;margin-top:12px;}
        .qr-spin{width:14px;height:14px;border:2px solid rgba(37,99,235,.3);border-top-color:#2563eb;border-radius:50%;animation:qr-spin .65s linear infinite;flex-shrink:0;}
        @keyframes qr-spin{to{transform:rotate(360deg)}}

        .qr-success{background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 16px;display:flex;align-items:flex-start;gap:10px;}
        .qr-success-icon{width:22px;height:22px;background:#22c55e;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;}
        .qr-success-text{font-size:13.5px;font-weight:600;color:#166534;}
        
        .qr-warning{background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 16px;display:flex;align-items:flex-start;gap:10px;}
        .qr-warning-icon{width:22px;height:22px;background:#f59e0b;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;}
        .qr-warning-text{font-size:13.5px;font-weight:600;color:#92400e;}

        .qr-error{background:#fff1f2;border:1px solid #fecaca;border-radius:10px;padding:14px 16px;display:flex;align-items:flex-start;gap:10px;}
        .qr-error-icon{width:22px;height:22px;background:#f43f5e;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;}
        .qr-error-text{font-size:13.5px;font-weight:600;color:#9f1239;}

        .qr-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
        .qr-stat{background:#f8fbff;border:1px solid #e0eeff;border-radius:10px;padding:14px 16px;text-align:center;}
        .qr-stat-val{font-size:26px;font-weight:800;color:#0f172a;letter-spacing:-1px;}
        .qr-stat-lbl{font-size:11.5px;color:#94a3b8;margin-top:3px;font-weight:500;}

        .qr-howto{margin-top:16px;}
        .qr-howto-title{font-size:12px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;}
        .qr-step{display:flex;align-items:flex-start;gap:10px;margin-bottom:9px;}
        .qr-step-num{width:20px;height:20px;background:#0284c7;color:#fff;border-radius:50%;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;}
        .qr-step-text{font-size:13px;color:#475569;}
      `}</style>

      <div className="qr-root">
        <div className="qr-header">
          <div className="qr-title">Quét mã QR</div>
          <div className="qr-subtitle">Hướng camera vào mã QR của sinh viên để điểm danh</div>
          {eventId && (
            <div>
              <span className="qr-event-badge">
                <svg viewBox="0 0 14 14" fill="none" width="12" height="12">
                  <rect x="1" y="2" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M5 1v2M9 1v2M1 6h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                Sự kiện #{eventId}
              </span>
            </div>
          )}
        </div>

        <div className="qr-layout">
          {/* Camera */}
          <div className="qr-card">
            <div className="qr-card-head">
              <span className="qr-card-title">Camera</span>
              <span style={{fontSize:11.5,color:'#22c55e',fontWeight:600,background:'#f0fdf4',padding:'3px 9px',borderRadius:20,border:'1px solid #bbf7d0'}}>● Đang hoạt động</span>
            </div>
            <div className="qr-card-body">
              <div className="qr-camera-wrap">
                <QrReader
                  constraints={{ facingMode: 'environment' }}
                  onResult={(result, err) => {
                    if (result) void handleScan(result.getText());
                  }}
                  containerStyle={{ width: '100%' }}
                />
              </div>

              {processing && (
                <div className="qr-processing">
                  <div className="qr-spin"/>
                  Đang xử lý check-in...
                </div>
              )}

              {lastResult && !processing && (
                <div className={lastResult.isWarning ? "qr-warning" : "qr-success"} style={{marginTop:12}}>
                  <div className={lastResult.isWarning ? "qr-warning-icon" : "qr-success-icon"}>
                    <svg viewBox="0 0 14 14" fill="none" width="10" height="10">
                      {lastResult.isWarning ? (
                        <path d="M7 3v4M7 9h.01" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                      ) : (
                        <path d="M2 7l3.5 3.5L12 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      )}
                    </svg>
                  </div>
                  <div className={lastResult.isWarning ? "qr-warning-text" : "qr-success-text"}>{lastResult.message}</div>
                </div>
              )}

              {error && !processing && (
                <div className="qr-error" style={{marginTop:12}}>
                  <div className="qr-error-icon">
                    <svg viewBox="0 0 14 14" fill="none" width="10" height="10">
                      <path d="M2 2l10 10M12 2L2 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="qr-error-text">{error}</div>
                </div>
              )}
            </div>
          </div>

          {/* Info panel */}
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {/* Stats */}
            <div className="qr-card">
              <div className="qr-card-head">
                <span className="qr-card-title">Thống kê phiên</span>
              </div>
              <div className="qr-card-body">
                <div className="qr-stats">
                  <div className="qr-stat">
                    <div className="qr-stat-val" style={{color:'#22c55e'}}>{scanCount}</div>
                    <div className="qr-stat-lbl">Đã check-in</div>
                  </div>
                  <div className="qr-stat">
                    <div className="qr-stat-val" style={{color:error?'#f43f5e':'#94a3b8'}}>{error ? 1 : 0}</div>
                    <div className="qr-stat-lbl">Lỗi gần nhất</div>
                  </div>
                </div>
              </div>
            </div>

            {/* How to */}
            <div className="qr-card">
              <div className="qr-card-head">
                <span className="qr-card-title">Hướng dẫn</span>
              </div>
              <div className="qr-card-body">
                <div className="qr-howto">
                  {[
                    'Yêu cầu sinh viên mở mã QR trên ứng dụng mobile',
                    'Hướng camera vào mã QR của sinh viên',
                    'Hệ thống tự động xử lý — không cần bấm nút',
                    'Kết quả hiển thị ngay sau khi quét',
                  ].map((step, i) => (
                    <div className="qr-step" key={i}>
                      <div className="qr-step-num">{i+1}</div>
                      <div className="qr-step-text">{step}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default QRScannerPage;