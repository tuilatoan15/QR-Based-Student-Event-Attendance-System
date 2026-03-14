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

  const features = [
    'Quét mã QR cực nhanh chỉ trong 1 giây',
    'Thống kê tham gia thời gian thực',
    'Quản lý hồ sơ sinh viên số hóa',
    'Xác thực bảo mật với JWT',
    'Giao diện thân thiện, dễ sử dụng'
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');

        .lp-root *{box-sizing:border-box;margin:0;padding:0}
        .lp-root{
          min-height:100vh;display:flex;align-items:center;justify-content:center;
          font-family:'Outfit',system-ui,sans-serif;
          background:#f4f7f6;padding:20px;
        }

        .lp-container{
          width:100%;max-width:1050px;height:650px;
          background:#fff;border-radius:30px;display:flex;
          overflow:hidden;box-shadow:0 30px 60px rgba(0,0,0,0.1);
        }

        /* LEFT SIDE: Static Features */
        .lp-left{
          flex:1.1;background:linear-gradient(135deg,#00CCFF,#0088CC);
          padding:60px 45px;display:flex;flex-direction:column;
          color:#fff;position:relative;
        }
        .lp-left-logo{
          width:150px;height:150px;margin:0 auto 40px;
          background:rgba(255,255,255,0.2);padding:15px;
          border-radius:50%;display:flex;align-items:center;justify-content:center;
          backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.3);
        }
        .lp-left-logo img{width:100%;height:100%;object-fit:contain;border-radius:50%;}

        .lp-left-title{font-size:32px;font-weight:700;margin-bottom:25px;letter-spacing:-0.5px;text-align:center;}
        
        .lp-feat-list{display:flex;flex-direction:column;gap:18px;max-width:320px;margin:0 auto;}
        .lp-feat-item{display:flex;align-items:flex-start;gap:15px;font-size:16px;color:rgba(255,255,255,0.92);}
        .lp-feat-tick{
          width:24px;height:24px;background:#fff;border-radius:50%;
          display:flex;align-items:center;justify-content:center;flex-shrink:0;
          color:#00CCFF;font-weight:bold;font-size:14px;
        }

        /* RIGHT SIDE: Form + Logo */
        .lp-right{flex:1;background:#fff;padding:50px;display:flex;flex-direction:column;justify-content:center;}
        .lp-right-content{width:100%;max-width:340px;margin:0 auto;}
        
        .lp-logo-top{
          width:120px;height:120px;margin:0 auto 25px;
          border-radius:50%;border:4px solid #f0f9ff;
          box-shadow:0 8px 20px rgba(0,204,255,0.15);
        }
        .lp-logo-top img{width:100%;height:100%;object-fit:cover;border-radius:50%;}

        .lp-header{margin-bottom:30px;text-align:center;}
        .lp-title{font-size:26px;font-weight:700;color:#1e293b;margin-bottom:6px;}
        .lp-sub{font-size:14px;color:#64748b;}

        .lp-form{display:flex;flex-direction:column;gap:20px;}
        .lp-field{display:flex;flex-direction:column;gap:8px;}
        .lp-field label{font-size:13.5px;font-weight:600;color:#475569;}
        
        .lp-in{
          width:100%;padding:13px 16px;background:#f8fafc;
          border:1.5px solid #e2e8f0;border-radius:12px;font-size:14.5px;
          color:#1e293b;transition:all 0.2s;
        }
        .lp-in:focus{
          background:#fff;border-color:#00CCFF;outline:none;
          box-shadow:0 0 0 4px rgba(0,204,255,0.1);
        }

        .lp-btn{
          width:100%;padding:13px;background:#00CCFF;color:#fff;
          border:none;border-radius:12px;font-size:15.5px;font-weight:700;
          cursor:pointer;transition:all 0.2s;margin-top:10px;
          box-shadow:0 4px 12px rgba(0,204,255,0.3);
          text-transform:uppercase;letter-spacing:1px;
        }
        .lp-btn:hover{background:#00B4D8;transform:translateY(-1px);}
        .lp-btn:disabled{opacity:0.6;cursor:not-allowed;}

        .lp-err{padding:12px;background:#fef2f2;border:1px solid #fecaca;border-radius:12px;color:#dc2626;font-size:13px;margin-bottom:15px;}

        @media(max-width:900px){
          .lp-container{height:auto;max-width:450px;}
          .lp-left{display:none;}
        }
      `}</style>

      <div className="lp-root">
        <div className="lp-container">
          {/* ── Left Side: Features List ── */}
          <div className="lp-left">
            <div className="lp-left-logo">
              <img src="/assets/logo/logo2.png" alt="University Logo 2" />
            </div>
            <h2 className="lp-left-title">QR Event<br />Attendance System</h2>
            <div className="lp-feat-list">
              {features.map((f, i) => (
                <div key={i} className="lp-feat-item">
                  <div className="lp-feat-tick">✓</div>
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* ── Right Side: Logo + Form ── */}
          <div className="lp-right">
            <div className="lp-right-content">
              <div className="lp-logo-top">
                <img src="/assets/logo/logo.png" alt="University Logo" />
              </div>

              <div className="lp-header">
                <h1 className="lp-title">ĐĂNG NHẬP</h1>
                <p className="lp-sub">Dành cho quản trị viên hệ thống</p>
              </div>

              {error && <div className="lp-err">{error}</div>}

              <form className="lp-form" onSubmit={handleSubmit}>
                <div className="lp-field">
                  <label>TÀI KHOẢN EMAIL</label>
                  <input
                    type="email"
                    placeholder="admin@university.edu"
                    className="lp-in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="lp-field">
                  <label>MẬT KHẨU</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="lp-in"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <div style={{ textAlign: 'right', marginTop: '6px' }}>
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#00CCFF', fontSize: '13px', fontWeight: '600' }}>
                       {showPassword ? 'ẨN MẬT KHẨU' : 'HIỆN MẬT KHẨU'}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="lp-btn">
                  {loading ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN ĐĂNG NHẬP'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;