import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/authApi';
import toast from 'react-hot-toast';

function pwStrength(pw: string): 0 | 1 | 2 | 3 {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw) || /[0-9]/.test(pw) || /[^a-zA-Z0-9]/.test(pw)) s++;
  return s as 0 | 1 | 2 | 3;
}
const strColor: Record<number, string> = { 0: '#e2e8f0', 1: '#f87171', 2: '#fbbf24', 3: '#34d399' };

export default function RegisterOrganizerPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr] = useState('');
  
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    orgName: '', position: '', phone: '', bio: '',
  });

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));

  const strength = pwStrength(form.password);

  const validate0 = (): boolean => {
    if (!form.fullName.trim()) { setErr('Vui lòng nhập họ và tên'); return false; }
    if (!form.email.trim() || !form.email.includes('@')) { setErr('Email không hợp lệ'); return false; }
    if (form.password.length < 6) { setErr('Mật khẩu tối thiểu 6 ký tự'); return false; }
    if (form.password !== form.confirmPassword) { setErr('Mật khẩu không khớp'); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.orgName.trim()) { setErr('Vui lòng nhập tên tổ chức/CLB'); return; }
    try {
      setLoading(true); setErr('');
      const res = await authApi.registerOrganizer({
        full_name: form.fullName, email: form.email, password: form.password,
        organization_name: form.orgName, position: form.position,
        phone: form.phone, bio: form.bio,
      });
      if (res.data.success) { setSuccess(true); toast.success(res.data.message || 'Đăng ký thành công!'); }
      else setErr(res.data.message || 'Đăng ký thất bại');
    } catch (ex: any) {
      setErr(ex.response?.data?.message || 'Lỗi kết nối. Vui lòng thử lại.');
    } finally { setLoading(false); }
  };

  const features = [
    'Quét mã QR điểm danh tức thì',
    'Chủ động xuất báo cáo danh sách tham dự',
    'Thống kê theo thời gian thực',
    'Bảo mật tuyệt đối thông tin sinh viên',
    'Hỗ trợ quản lý chuyên nghiệp cho CLB/Khoa'
  ];

  if (success) {
    return (
      <div className="lp-root text-center">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
          .lp-root * { box-sizing: border-box; margin: 0; padding: 0; }
          .lp-root { min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: 'Outfit', sans-serif; background: #f4f7f6; padding: 20px; }
          .suc-card { background: #fff; padding: 50px 40px; border-radius: 20px; box-shadow: 0 20px 40px rgba(0,0,0,0.08); max-width: 420px; width: 100%; }
          .suc-icon { width: 80px; height: 80px; background: #ecfdf5; border: 4px solid #6ee7b7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: #059669; font-size: 32px; font-weight: bold; }
          .lp-btn { width: 100%; padding: 13px; background: #00CCFF; color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(0,204,255,0.3); text-transform: uppercase; margin-top: 25px; }
          .lp-btn:hover { background: #00B4D8; transform: translateY(-1px); }
        `}</style>
        <div className="suc-card">
          <div className="suc-icon">✓</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1e293b', marginBottom: 10 }}>Đăng ký thành công!</h2>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>
            Tài khoản của bạn đang chờ Admin xét duyệt.<br />
            Quá trình thường mất <strong style={{ color: '#00CCFF' }}>1–2 ngày làm việc</strong>.
          </p>
          <button className="lp-btn" onClick={() => navigate('/login')}>Về trang đăng nhập</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');

        .lp-root *{box-sizing:border-box;margin:0;padding:0}
        .lp-root{
          min-height:100vh;display:flex;align-items:center;justify-content:center;
          font-family:'Outfit',system-ui,sans-serif;
          background:#f4f7f6;padding:20px;
        }

        .lp-container{
          width:100%;max-width:1150px;min-height:650px;
          background:#fff;border-radius:30px;display:flex;
          overflow:hidden;box-shadow:0 30px 60px rgba(0,0,0,0.1);
        }

        /* LEFT SIDE */
        .lp-left{
          flex:1;background:linear-gradient(135deg,#00CCFF,#0088CC);
          padding:60px 45px;display:flex;flex-direction:column;
          color:#fff;position:relative;
        }
        .lp-left-logo{
          width:120px;height:120px;margin:0 auto 40px;
          background:rgba(255,255,255,0.2);padding:15px;
          border-radius:50%;display:flex;align-items:center;justify-content:center;
          backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.3);
        }
        .lp-left-logo img{width:100%;height:100%;object-fit:contain;border-radius:50%;}

        .lp-left-title{font-size:30px;font-weight:800;margin-bottom:20px;letter-spacing:-0.5px;text-align:center;}
        .lp-left-desc{font-size:15px;color:rgba(255,255,255,0.85);text-align:center;margin-bottom:40px;line-height:1.6;}
        
        .lp-feat-list{display:flex;flex-direction:column;gap:18px;max-width:340px;margin:0 auto;}
        .lp-feat-item{display:flex;align-items:flex-start;gap:15px;font-size:15px;font-weight:500;color:rgba(255,255,255,0.95);}
        .lp-feat-tick{
          width:22px;height:22px;background:#fff;border-radius:50%;
          display:flex;align-items:center;justify-content:center;flex-shrink:0;
          color:#00CCFF;font-weight:bold;font-size:13px;
        }

        /* RIGHT SIDE */
        .lp-right{flex:1.2;background:#fff;padding:50px 60px;display:flex;flex-direction:column;}
        .lp-right-content{width:100%;max-width:440px;margin:0 auto;}

        .lp-header{margin-bottom:30px;}
        .lp-title{font-size:26px;font-weight:800;color:#1e293b;margin-bottom:6px;letter-spacing:-0.5px;}
        .lp-sub{font-size:14px;color:#64748b;font-weight:500;}

        /* STEPS */
        .lp-steps{display:flex;align-items:center;margin-bottom:25px;}
        .lp-step{display:flex;flex-direction:column;align-items:center;gap:6px;flex-shrink:0;}
        .lp-step-circle{
          width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;
          font-size:13px;font-weight:700;border:2px solid;transition:all 0.3s;
        }
        .lp-step-done{background:#ecfdf5;border-color:#6ee7b7;color:#059669;}
        .lp-step-curr{background:#00CCFF;border-color:#00CCFF;color:#fff;}
        .lp-step-wait{background:#f8fafc;border-color:#e2e8f0;color:#94a3b8;}
        .lp-step-lbl{font-size:12px;font-weight:600;}
        .lp-step-lbl.curr{color:#1e293b;}
        .lp-step-lbl.wait{color:#94a3b8;}
        .lp-step-line{flex:1;height:2px;border-radius:2px;margin:0 10px;transform:translateY(-10px);transition:all 0.3s;}

        .lp-form{display:flex;flex-direction:column;gap:20px;}
        .lp-field{display:flex;flex-direction:column;gap:8px;}
        .lp-field label{font-size:12.5px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.5px;}
        
        .lp-in{
          width:100%;padding:13px 16px;background:#f8fafc;
          border:1.5px solid #e2e8f0;border-radius:12px;font-size:14.5px;
          color:#1e293b;transition:all 0.2s;font-family:inherit;
        }
        .lp-in:focus{
          background:#fff;border-color:#00CCFF;outline:none;
          box-shadow:0 0 0 4px rgba(0,204,255,0.12);
        }

        .lp-btn{
          width:100%;padding:14px;background:#00CCFF;color:#fff;
          border:none;border-radius:12px;font-size:15px;font-weight:700;
          cursor:pointer;transition:all 0.2sCb;margin-top:10px;
          box-shadow:0 4px 12px rgba(0,204,255,0.25);
          display:flex;align-items:center;justify-content:center;gap:8px;
        }
        .lp-btn:hover:not(:disabled){background:#00B4D8;transform:translateY(-1px);}
        .lp-btn:disabled{opacity:0.6;cursor:not-allowed;box-shadow:none;}

        .lp-btn-out{
          width:100%;padding:14px;background:#fff;color:#475569;
          border:1.5px solid #e2e8f0;border-radius:12px;font-size:15px;font-weight:600;
          cursor:pointer;transition:all 0.2s;
        }
        .lp-btn-out:hover{background:#f1f5f9;border-color:#cbd5e1;}

        .lp-err{padding:12px;background:#fef2f2;border:1.5px solid #fecaca;border-radius:12px;color:#dc2626;font-size:13.5px;}
        .lp-notice{padding:12px 14px;background:#fffbeb;border:1.5px solid #fde68a;border-radius:12px;color:#92400e;font-size:13.5px;line-height:1.5;}

        .grid-2 { display:grid; grid-template-columns: 1fr 1fr; gap: 15px; }

        @media(max-width:950px){
          .lp-container{flex-direction:column;height:auto;max-width:550px;}
          .lp-left{display:none;} /* Hoặc thiết kế thu gọn banner */
          .lp-right{padding:40px 30px;}
        }
      `}</style>

      <div className="lp-root">
        <div className="lp-container">
          
          {/* ── Left Side: Features List ── */}
          <div className="lp-left">
            <div className="lp-left-logo">
              <img src="/assets/logo/logo2.png" alt="University Logo 2" />
            </div>
            <h2 className="lp-left-title">Đăng Ký<br/>Ban Tổ Chức</h2>
            <p className="lp-left-desc">
              Tạo tài khoản quản lý dành riêng cho các CLB, Liên Chi và Đoàn khoa tại trường.
            </p>
            <div className="lp-feat-list">
              {features.map((f, i) => (
                <div key={i} className="lp-feat-item">
                  <div className="lp-feat-tick">✓</div>
                  {f}
                </div>
              ))}
            </div>
          </div>

          {/* ── Right Side: Form ── */}
          <div className="lp-right">
            <div className="lp-right-content">
              
              <div className="lp-header">
                <h1 className="lp-title">TẠO TÀI KHOẢN</h1>
                <p className="lp-sub">Nhập thông tin đăng ký dành cho Ban tổ chức</p>
              </div>

              {/* Steps */}
              <div className="lp-steps">
                <div className="lp-step">
                  <div className={`lp-step-circle ${step > 0 ? 'lp-step-done' : 'lp-step-curr'}`}>
                    {step > 0 ? '✓' : '1'}
                  </div>
                  <span className={`lp-step-lbl ${step === 0 ? 'curr' : 'wait'}`}>Tài khoản</span>
                </div>
                <div className={`lp-step-line ${step > 0 ? 'bg-[#00CCFF]' : 'bg-[#e2e8f0]'}`} style={{ background: step > 0 ? '#00CCFF' : '#e2e8f0' }} />
                
                <div className="lp-step">
                  <div className={`lp-step-circle ${step === 1 ? 'lp-step-curr' : 'lp-step-wait'}`}>
                    2
                  </div>
                  <span className={`lp-step-lbl ${step === 1 ? 'curr' : 'wait'}`}>Tổ chức</span>
                </div>
              </div>

              {err && <div className="lp-err">{err}</div>}

              <form className="lp-form" onSubmit={handleSubmit}>
                
                {step === 0 && (
                  <>
                    <div className="lp-notice">
                      Bạn cần điền thông tin người đại diện. Tài khoản sẽ được kích hoạt sau khi admin phê duyệt.
                    </div>
                    
                    <div className="lp-field">
                      <label>HỌ VÀ TÊN <span style={{color:'#00CCFF'}}>*</span></label>
                      <input type="text" placeholder="Nguyễn Văn A" className="lp-in" value={form.fullName} onChange={set('fullName')} />
                    </div>

                    <div className="lp-field">
                      <label>EMAIL <span style={{color:'#00CCFF'}}>*</span></label>
                      <input type="email" placeholder="tochuc@university.edu" className="lp-in" value={form.email} onChange={set('email')} />
                    </div>

                    <div className="grid-2">
                      <div className="lp-field">
                        <label style={{display:'flex', justifyContent:'space-between'}}>MẬT KHẨU <span style={{color:'#00CCFF'}}>*</span></label>
                        <div style={{position:'relative'}}>
                          <input type={showPw ? 'text' : 'password'} placeholder="Tối thiểu 6 ký tự" className="lp-in" style={{paddingRight: '40px'}} value={form.password} onChange={set('password')} />
                          <button type="button" onClick={() => setShowPw(!showPw)} style={{ position:'absolute', right:12, top:13, background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontWeight:600, fontSize:12 }}>
                            {showPw ? 'ẨN' : 'HIỆN'}
                          </button>
                        </div>
                        {form.password && (
                          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                            {[1, 2, 3].map(i => (
                              <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= strength ? strColor[strength] : '#e2e8f0', transition: 'background .2s' }} />
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="lp-field">
                        <label>XÁC NHẬN MK <span style={{color:'#00CCFF'}}>*</span></label>
                        <div style={{position:'relative'}}>
                          <input type={showCpw ? 'text' : 'password'} placeholder="Nhập lại" className="lp-in" style={{paddingRight: '40px'}} value={form.confirmPassword} onChange={set('confirmPassword')} />
                          <button type="button" onClick={() => setShowCpw(!showCpw)} style={{ position:'absolute', right:12, top:13, background:'none', border:'none', cursor:'pointer', color:'#94a3b8', fontWeight:600, fontSize:12 }}>
                            {showCpw ? 'ẨN' : 'HIỆN'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button type="button" className="lp-btn" onClick={() => { setErr(''); if (validate0()) setStep(1); }}>
                      TIẾP THEO
                    </button>
                    
                    <div style={{ textAlign: 'center', marginTop: '10px' }}>
                     <span style={{color:'#64748b', fontSize:'14px'}}>Đã có tài khoản? </span>
                      <Link to="/login" style={{ color: '#00CCFF', fontSize: '14px', fontWeight: '700', textDecoration: 'none' }}>
                        Đăng nhập
                      </Link>
                    </div>
                  </>
                )}

                {step === 1 && (
                  <>
                    <div className="lp-field">
                      <label>TÊN TỔ CHỨC / CLB / KHOA <span style={{color:'#00CCFF'}}>*</span></label>
                      <input type="text" placeholder="CLB Tin Học / Khoa Kỹ Thuật" className="lp-in" value={form.orgName} onChange={set('orgName')} />
                    </div>

                    <div className="grid-2">
                      <div className="lp-field">
                        <label>CHỨC VỤ</label>
                        <input type="text" placeholder="Trưởng ban / Chủ nhiệm" className="lp-in" value={form.position} onChange={set('position')} />
                      </div>
                      <div className="lp-field">
                        <label>SỐ ĐIỆN THOẠI</label>
                        <input type="tel" placeholder="0901 234 567" className="lp-in" value={form.phone} onChange={set('phone')} />
                      </div>
                    </div>

                    <div className="lp-field">
                      <label>GIỚI THIỆU NGẮN (TỐI ĐA 500 KÝ TỰ)</label>
                      <textarea placeholder="Mô tả về quy mô, hoạt động của tổ chức..." className="lp-in" style={{ height: '80px', resize: 'none' }} maxLength={500} value={form.bio} onChange={set('bio')} />
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:'15px', marginTop:'5px' }}>
                      <button type="button" className="lp-btn-out" onClick={() => { setErr(''); setStep(0); }}>
                        QUAY LẠI
                      </button>
                      <button type="submit" disabled={loading} className="lp-btn">
                        {loading ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN ĐĂNG KÝ'}
                      </button>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '10px' }}>
                     <span style={{color:'#64748b', fontSize:'14px'}}>Đã có tài khoản? </span>
                      <Link to="/login" style={{ color: '#00CCFF', fontSize: '14px', fontWeight: '700', textDecoration: 'none' }}>
                        Đăng nhập
                      </Link>
                    </div>
                  </>
                )}

              </form>
            </div>
          </div>
          
        </div>
      </div>
    </>
  );
}