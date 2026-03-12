import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const LoginPage: React.FC = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      const message =
        err?.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
      toast.error(message);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

        .lp-root *{box-sizing:border-box;margin:0;padding:0}
        .lp-root{
          min-height:100vh;display:flex;
          font-family:'Inter',system-ui,sans-serif;
          background:#f0f7ff;
        }

        /* LEFT */
        .lp-left{
          width:420px;flex-shrink:0;
          background:linear-gradient(155deg,#38bdf8 0%,#0284c7 55%,#0369a1 100%);
          display:flex;flex-direction:column;justify-content:center;
          padding:56px 44px;position:relative;overflow:hidden;
        }
        .lp-left::before{
          content:'';position:absolute;top:-100px;right:-100px;
          width:300px;height:300px;border-radius:50%;
          background:rgba(255,255,255,0.09);pointer-events:none;
        }
        .lp-left::after{
          content:'';position:absolute;bottom:-80px;left:-60px;
          width:240px;height:240px;border-radius:50%;
          background:rgba(255,255,255,0.06);pointer-events:none;
        }

        .lp-brand-icon{
          width:54px;height:54px;
          background:rgba(255,255,255,0.22);
          border:1.5px solid rgba(255,255,255,0.35);
          border-radius:15px;display:flex;align-items:center;
          justify-content:center;margin-bottom:30px;
        }
        .lp-brand-title{
          font-size:31px;font-weight:800;color:#fff;
          line-height:1.2;letter-spacing:-0.8px;margin-bottom:14px;
        }
        .lp-brand-desc{
          font-size:14px;color:rgba(255,255,255,0.78);
          line-height:1.75;margin-bottom:40px;
        }
        .lp-features{display:flex;flex-direction:column;gap:13px;}
        .lp-feat{
          display:flex;align-items:center;gap:13px;
          font-size:13.5px;color:rgba(255,255,255,0.92);font-weight:500;
        }
        .lp-feat-box{
          width:30px;height:30px;background:rgba(255,255,255,0.18);
          border-radius:8px;display:flex;align-items:center;
          justify-content:center;flex-shrink:0;font-size:15px;
        }

        /* RIGHT */
        .lp-right{
          flex:1;display:flex;align-items:center;
          justify-content:center;padding:40px 24px;background:#f0f7ff;
        }
        .lp-card{
          width:100%;max-width:400px;background:#ffffff;
          border-radius:20px;padding:40px 36px;
          box-shadow:0 2px 8px rgba(14,165,233,0.08),
                     0 12px 40px rgba(14,165,233,0.13),
                     0 0 0 1px rgba(14,165,233,0.07);
        }
        .lp-card-logo{
          width:46px;height:46px;
          background:linear-gradient(135deg,#38bdf8,#0284c7);
          border-radius:13px;display:flex;align-items:center;
          justify-content:center;margin:0 auto 20px;
          box-shadow:0 4px 14px rgba(14,165,233,0.38);
        }
        .lp-card-title{
          font-size:21px;font-weight:700;color:#0f172a;
          text-align:center;letter-spacing:-0.4px;margin-bottom:6px;
        }
        .lp-card-sub{
          font-size:13.5px;color:#94a3b8;
          text-align:center;margin-bottom:30px;
        }

        /* Error */
        .lp-err{
          display:flex;align-items:flex-start;gap:8px;
          background:#fef2f2;border:1px solid #fecaca;
          border-radius:10px;padding:10px 13px;
          font-size:13px;color:#dc2626;margin-bottom:20px;
        }

        /* Form */
        .lp-form{display:flex;flex-direction:column;gap:18px;}
        .lp-field label{
          display:block;font-size:13px;font-weight:600;
          color:#374151;margin-bottom:7px;
        }
        .lp-wrap{position:relative;}
        .lp-ico{
          position:absolute;left:13px;top:50%;
          transform:translateY(-50%);color:#94a3b8;
          pointer-events:none;display:flex;align-items:center;
        }
        .lp-in{
          width:100%;
          padding:11px 14px 11px 40px;
          background:#f8fafc;
          border:1.5px solid #e2e8f0;
          border-radius:10px;
          font-size:14px;
          font-family:'Inter',sans-serif;
          color:#0f172a;
          outline:none;
          transition:border-color .15s,box-shadow .15s,background .15s;
          -webkit-appearance:none;
        }
        .lp-in::placeholder{color:#cbd5e1;}
        .lp-in:focus{
          background:#fff;
          border-color:#0ea5e9;
          box-shadow:0 0 0 3px rgba(14,165,233,0.15);
        }
        .lp-in-pr{padding-right:42px;}
        .lp-eye{
          position:absolute;right:12px;top:50%;
          transform:translateY(-50%);background:none;border:none;
          cursor:pointer;color:#94a3b8;padding:2px;
          display:flex;align-items:center;transition:color .15s;
        }
        .lp-eye:hover{color:#64748b;}

        /* Button */
        .lp-btn{
          width:100%;padding:12.5px;
          background:linear-gradient(135deg,#38bdf8,#0284c7);
          color:#fff;border:none;border-radius:10px;
          font-size:14.5px;font-weight:600;
          font-family:'Inter',sans-serif;cursor:pointer;
          transition:opacity .15s,transform .15s,box-shadow .15s;
          display:flex;align-items:center;justify-content:center;gap:8px;
          margin-top:4px;
          box-shadow:0 4px 16px rgba(14,165,233,0.42);
          letter-spacing:-0.1px;
        }
        .lp-btn:hover:not(:disabled){
          opacity:.92;transform:translateY(-1px);
          box-shadow:0 6px 22px rgba(14,165,233,0.52);
        }
        .lp-btn:active:not(:disabled){transform:translateY(0);}
        .lp-btn:disabled{opacity:.62;cursor:not-allowed;}

        .lp-spin{
          width:15px;height:15px;
          border:2.5px solid rgba(255,255,255,0.35);
          border-top-color:#fff;border-radius:50%;
          animation:lpspin .65s linear infinite;
        }
        @keyframes lpspin{to{transform:rotate(360deg)}}

        .lp-foot{
          text-align:center;font-size:12px;
          color:#cbd5e1;margin-top:26px;
        }

        @media(max-width:860px){.lp-left{display:none;}}
      `}</style>

      <div className="lp-root">
        {/* ── Left ── */}
        <div className="lp-left">
          <div className="lp-brand-icon">
            <svg viewBox="0 0 24 24" fill="none" width="26" height="26">
              <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"
                stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="lp-brand-title">QR Event<br />Attendance</h2>
          <p className="lp-brand-desc">
            Quản lý sự kiện, quét QR điểm danh và theo dõi thống kê — tất cả trong một nơi.
          </p>
          <div className="lp-features">
            {[
              { icon: '⚡', label: 'Quét QR thời gian thực' },
              { icon: '📊', label: 'Thống kê điểm danh' },
              { icon: '👥', label: 'Quản lý sinh viên' },
              { icon: '🔒', label: 'Xác thực bảo mật JWT' },
            ].map((f) => (
              <div className="lp-feat" key={f.label}>
                <div className="lp-feat-box">{f.icon}</div>
                {f.label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right ── */}
        <div className="lp-right">
          <div className="lp-card">
            <div className="lp-card-logo">
              <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
                <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2"/>
              </svg>
            </div>
            <h1 className="lp-card-title">Chào mừng trở lại</h1>
            <p className="lp-card-sub">Đăng nhập vào tài khoản quản trị</p>

            {error && (
              <div className="lp-err">
                <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16" style={{flexShrink:0,marginTop:1}}>
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                {error}
              </div>
            )}

            <form className="lp-form" onSubmit={handleSubmit}>
              <div className="lp-field">
                <label>Email</label>
                <div className="lp-wrap">
                  <span className="lp-ico">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                    </svg>
                  </span>
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="admin@example.com"
                    className="lp-in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="lp-field">
                <label>Mật khẩu</label>
                <div className="lp-wrap">
                  <span className="lp-ico">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="15" height="15">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                    </svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="lp-in lp-in-pr"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button type="button" className="lp-eye" onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                    {showPassword ? (
                      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd"/>
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="lp-btn">
                {loading ? <><span className="lp-spin"/>Đang đăng nhập...</> : 'Đăng nhập'}
              </button>
            </form>

            <p className="lp-foot">QR-Based Student Event Attendance — Admin Portal</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;