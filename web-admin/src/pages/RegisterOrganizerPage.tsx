import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/authApi';
import {
  Mail, Lock, User, FileText, Users, Phone,
  CheckCircle, AlertCircle, ArrowRight, ArrowLeft,
  Eye, EyeOff, Briefcase, Shield, Clock, BarChart2,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Helpers ─────────────────────────────────────────────────────
function pwStrength(pw: string): number {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw) || /[0-9]/.test(pw) || /[^a-zA-Z0-9]/.test(pw)) s++;
  return s;
}

const inp =
  'w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl ' +
  'text-[14px] text-slate-800 placeholder-slate-400 ' +
  'focus:outline-none focus:border-[#00CCFF] focus:ring-2 focus:ring-[#00CCFF]/20 transition-colors';

const Field: React.FC<{ label: string; required?: boolean; hint?: string; children: React.ReactNode }> = ({ label, required, hint, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-bold tracking-widest uppercase text-slate-400">
      {label}{required && <span className="text-[#00CCFF] ml-0.5 normal-case tracking-normal">*</span>}
    </label>
    {children}
    {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
  </div>
);

const Ico: React.FC<{ children: React.ReactNode; top?: boolean }> = ({ children, top }) => (
  <div className={`absolute left-3 ${top ? 'top-3' : 'top-1/2 -translate-y-1/2'} text-slate-400 pointer-events-none`}>
    {children}
  </div>
);

// ─── Step Indicator ───────────────────────────────────────────────
const Steps: React.FC<{ step: number }> = ({ step }) => {
  const labels = ['Tài khoản', 'Tổ chức', 'Xét duyệt'];
  return (
    <div className="flex items-start mb-7">
      {labels.map((lbl, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2
              ${i < step  ? 'bg-emerald-500 border-emerald-500 text-white'
              : i === step ? 'bg-[#00CCFF] border-[#00CCFF] text-white'
                           : 'bg-white border-slate-200 text-slate-400'}`}>
              {i < step ? <CheckCircle size={13} strokeWidth={3} /> : i + 1}
            </div>
            <span className={`text-[10.5px] font-semibold whitespace-nowrap
              ${i === step ? 'text-slate-700' : 'text-slate-400'}`}>{lbl}</span>
          </div>
          {i < 2 && (
            <div className={`flex-1 h-[2px] mx-2 mt-4 rounded-full transition-all
              ${i < step ? 'bg-[#00CCFF]' : 'bg-slate-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// ─── Left Panel ───────────────────────────────────────────────────
const Left: React.FC<{ step: number }> = ({ step }) => {
  const features = [
    { icon: <Shield size={15} />, t: 'Xét duyệt bởi admin', s: 'Tài khoản kích hoạt sau khi được phê duyệt' },
    { icon: <Clock size={15} />,  t: 'Điểm danh thời gian thực', s: 'Quét QR, ghi nhận tức thì không chờ đợi' },
    { icon: <BarChart2 size={15} />, t: 'Xuất báo cáo & Google Sheets', s: 'Đồng bộ danh sách tham dự tự động' },
  ];
  return (
    <div className="hidden lg:flex flex-col p-12 relative overflow-hidden" style={{ background: '#0A0F1E' }}>
      {/* dot-grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, rgba(0,204,255,0.14) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }} />
      {/* brand */}
      <div className="relative z-10 flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#00CCFF' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A0F1E" strokeWidth="2.5" strokeLinecap="round">
            <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" /><path d="M14 17h7M17.5 14v7" />
          </svg>
        </div>
        <span className="text-white font-bold text-[15px] tracking-tight">EventSync</span>
      </div>

      {/* hero */}
      <div className="relative z-10 mt-16 flex-1">
        <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 mb-6 border"
          style={{ background: 'rgba(0,204,255,0.08)', borderColor: 'rgba(0,204,255,0.2)' }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#00CCFF' }} />
          <span className="text-[11px] font-semibold tracking-widest uppercase" style={{ color: '#00CCFF' }}>
            Dành cho ban tổ chức
          </span>
        </div>
        <h1 className="text-white text-[30px] font-bold leading-tight tracking-tight mb-4">
          Quản lý sự kiện<br />sinh viên{' '}
          <span style={{ color: '#00CCFF' }}>chuyên nghiệp</span>
        </h1>
        <p className="text-sm leading-relaxed mb-10 max-w-[280px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Nền tảng điểm danh QR Code cho CLB, Khoa và ban tổ chức tại trường đại học.
        </p>
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-3.5 rounded-2xl px-4 py-3.5 mb-3 border"
            style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.07)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border"
              style={{ background:'rgba(0,204,255,0.08)', borderColor:'rgba(0,204,255,0.18)', color:'rgba(0,204,255,0.8)' }}>
              {f.icon}
            </div>
            <div>
              <p className="text-[13px] font-medium mb-0.5" style={{ color: 'rgba(255,255,255,0.85)' }}>{f.t}</p>
              <p className="text-[11.5px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{f.s}</p>
            </div>
          </div>
        ))}
      </div>

      {/* step dots */}
      <div className="relative z-10 flex items-center gap-1.5 mt-8">
        {[0,1,2].map(i => (
          <div key={i} className="h-[3px] rounded-full transition-all duration-300"
            style={{ width: i === step ? 24 : 8, background: i === step ? '#00CCFF' : 'rgba(255,255,255,0.15)' }} />
        ))}
      </div>
    </div>
  );
};

// ─── Cyan button ─────────────────────────────────────────────────
const CyanBtn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { full?: boolean }> = ({ children, full, ...props }) => (
  <button
    {...props}
    className={`${full ? 'w-full' : ''} text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed`}
    style={{ background: '#00CCFF', ...props.style }}
    onMouseEnter={e => { if (!props.disabled) e.currentTarget.style.background = '#00B8E6'; }}
    onMouseLeave={e => { e.currentTarget.style.background = '#00CCFF'; }}
  >
    {children}
  </button>
);

// ─── Main component ───────────────────────────────────────────────
export default function RegisterOrganizerPage() {
  const navigate = useNavigate();
  const [step, setStep]       = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [err, setErr]         = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [form, setForm]       = useState({
    fullName:'', email:'', password:'', confirmPassword:'',
    orgName:'', position:'', phone:'', bio:'',
  });

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [k]: e.target.value }));

  const strength   = pwStrength(form.password);
  const strClr     = ['','bg-red-400','bg-amber-400','bg-emerald-400'][strength] || '';
  const strLabel   = ['','Yếu','Trung bình','Mạnh'][strength] || '';

  const validate0 = (): boolean => {
    if (!form.fullName.trim())                       { setErr('Vui lòng nhập họ và tên'); return false; }
    if (!form.email.trim() || !form.email.includes('@')) { setErr('Email không hợp lệ'); return false; }
    if (form.password.length < 6)                    { setErr('Mật khẩu tối thiểu 6 ký tự'); return false; }
    if (form.password !== form.confirmPassword)      { setErr('Mật khẩu không khớp'); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.orgName.trim()) { setErr('Vui lòng nhập tên tổ chức'); return; }
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

  // ── Success ─────────────────────────────────────────────────────
  if (success) return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-10 text-center" style={{ boxShadow:'0 8px 40px rgba(0,0,0,0.08)' }}>
        <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} strokeWidth={1.5} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-3">Đăng ký thành công!</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          Tài khoản Organizer của bạn đang chờ admin xét duyệt.
          Thường mất <strong className="text-slate-700">1–2 ngày làm việc</strong>.
        </p>
        <CyanBtn full onClick={() => navigate('/login')}>
          <ArrowLeft size={16} /> Về trang đăng nhập
        </CyanBtn>
      </div>
    </div>
  );

  // ── Main ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen grid" style={{ gridTemplateColumns: '420px 1fr' }}>
      <Left step={step} />

      <div className="flex items-center justify-center bg-slate-100 p-6 overflow-y-auto min-h-screen">
        <div className="w-full max-w-[460px] bg-white rounded-2xl p-8 my-6" style={{ boxShadow:'0 4px 32px rgba(0,0,0,0.07)' }}>

          {/* Mobile brand */}
          <div className="flex lg:hidden items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:'#00CCFF' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0A0F1E" strokeWidth="2.5" strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" /><path d="M14 17h7M17.5 14v7" />
              </svg>
            </div>
            <span className="font-bold text-slate-800">EventSync</span>
          </div>

          <div className="mb-6">
            <h2 className="text-[22px] font-bold text-slate-800 tracking-tight mb-1.5">Tạo tài khoản Organizer</h2>
            <p className="text-slate-400 text-sm">Ban tổ chức · CLB · Khoa</p>
          </div>

          <Steps step={step} />

          {/* Error banner */}
          {err && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3.5 mb-5">
              <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-red-700 text-[13px] leading-snug">{err}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* ── STEP 0 ─────────────────────────────────────── */}
            {step === 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-2.5 rounded-xl p-3.5 border"
                  style={{ background:'#FFFBEB', borderColor:'#FDE68A' }}>
                  <AlertCircle size={14} className="mt-0.5 shrink-0" style={{ color:'#D97706' }} />
                  <p className="text-[12.5px] leading-relaxed" style={{ color:'#92400E' }}>
                    Sau khi đăng ký, admin sẽ xét duyệt tài khoản trong{' '}
                    <strong>1–2 ngày làm việc</strong>.
                  </p>
                </div>

                <Field label="Họ và tên" required>
                  <div className="relative">
                    <Ico><User size={15} /></Ico>
                    <input className={inp} type="text" placeholder="Nguyễn Văn A"
                      value={form.fullName} onChange={set('fullName')} />
                  </div>
                </Field>

                <Field label="Email" required>
                  <div className="relative">
                    <Ico><Mail size={15} /></Ico>
                    <input className={inp} type="email" placeholder="organizer@university.edu"
                      value={form.email} onChange={set('email')} />
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Mật khẩu" required hint={form.password ? strLabel : undefined}>
                    <div className="relative">
                      <Ico><Lock size={15} /></Ico>
                      <input className={`${inp} pr-10`} type={showPw ? 'text' : 'password'}
                        placeholder="Tối thiểu 6 ký tự" value={form.password} onChange={set('password')} />
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {form.password && (
                      <div className="flex gap-1 mt-1">
                        {[1,2,3].map(i => (
                          <div key={i} className={`h-[3px] flex-1 rounded-full transition-all ${i <= strength ? strClr : 'bg-slate-200'}`} />
                        ))}
                      </div>
                    )}
                  </Field>

                  <Field label="Xác nhận MK" required>
                    <div className="relative">
                      <Ico><Lock size={15} /></Ico>
                      <input className={`${inp} pr-10`} type={showCpw ? 'text' : 'password'}
                        placeholder="Nhập lại" value={form.confirmPassword} onChange={set('confirmPassword')} />
                      <button type="button" onClick={() => setShowCpw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showCpw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </Field>
                </div>

                <CyanBtn full type="button" onClick={() => { setErr(''); if (validate0()) setStep(1); }}>
                  Tiếp theo <ArrowRight size={16} />
                </CyanBtn>

                <p className="text-center text-slate-400 text-[13px]">
                  Đã có tài khoản?{' '}
                  <Link to="/login" className="font-semibold hover:underline" style={{ color:'#00CCFF' }}>Đăng nhập</Link>
                </p>
              </div>
            )}

            {/* ── STEP 1 ─────────────────────────────────────── */}
            {step === 1 && (
              <div className="flex flex-col gap-4">
                <Field label="Tên tổ chức / CLB / Khoa" required>
                  <div className="relative">
                    <Ico><Users size={15} /></Ico>
                    <input className={inp} type="text" placeholder="CLB CNTT / Khoa Kỹ thuật"
                      value={form.orgName} onChange={set('orgName')} />
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Chức vụ">
                    <div className="relative">
                      <Ico><Briefcase size={15} /></Ico>
                      <input className={inp} type="text" placeholder="Trưởng CLB"
                        value={form.position} onChange={set('position')} />
                    </div>
                  </Field>
                  <Field label="Số điện thoại">
                    <div className="relative">
                      <Ico><Phone size={15} /></Ico>
                      <input className={inp} type="tel" placeholder="0901 234 567"
                        value={form.phone} onChange={set('phone')} />
                    </div>
                  </Field>
                </div>

                <Field label="Giới thiệu ngắn" hint="Tối đa 500 ký tự">
                  <div className="relative">
                    <Ico top><FileText size={15} /></Ico>
                    <textarea className={`${inp} !h-auto py-3`} rows={3} maxLength={500}
                      placeholder="Mô tả về tổ chức của bạn..."
                      value={form.bio} onChange={set('bio')} />
                  </div>
                </Field>

                <div className="flex items-start gap-2.5 rounded-xl p-3.5 border"
                  style={{ background:'#FFFBEB', borderColor:'#FDE68A' }}>
                  <AlertCircle size={14} className="mt-0.5 shrink-0" style={{ color:'#D97706' }} />
                  <p className="text-[12.5px] leading-relaxed" style={{ color:'#92400E' }}>
                    Tài khoản sẽ được kích hoạt sau khi admin phê duyệt. Bạn sẽ nhận thông báo qua email.
                  </p>
                </div>

                <div className="grid gap-2.5" style={{ gridTemplateColumns:'1fr 2fr' }}>
                  <button type="button" onClick={() => { setErr(''); setStep(0); }}
                    className="flex items-center justify-center gap-1.5 border-2 border-slate-200 hover:border-slate-300 bg-white text-slate-600 font-semibold py-3.5 rounded-xl transition-colors">
                    <ArrowLeft size={15} /> Quay lại
                  </button>
                  <CyanBtn type="submit" disabled={loading}>
                    {loading
                      ? <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M21 12a9 9 0 1 1-6.22-8.56" strokeLinecap="round" />
                        </svg>
                      : <CheckCircle size={15} />}
                    {loading ? 'Đang xử lý...' : 'Gửi yêu cầu đăng ký'}
                  </CyanBtn>
                </div>

                <p className="text-center text-slate-400 text-[13px]">
                  Đã có tài khoản?{' '}
                  <Link to="/login" className="font-semibold hover:underline" style={{ color:'#00CCFF' }}>Đăng nhập</Link>
                </p>
              </div>
            )}

          </form>
        </div>
      </div>
    </div>
  );
}