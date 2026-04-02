import React, { useState, useEffect, useRef } from 'react';
import { usersApi } from '../api/usersApi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Loader2, Save, User, Building2, Phone, Globe, FileText, BadgeCheck, AlertCircle, Briefcase, Camera, Lock, Key } from 'lucide-react';

// ─── Design tokens ────────────────────────────────────────────────
const C = {
  cyan: '#00CCFF',
  cyanHover: '#00B8E6',
  dark: '#0A0F1E',
  white: '#FFFFFF',
  bg: '#F0F4FF',
  ink: '#1E293B',
  ink2: '#475569',
  ink3: '#64748B',
  ink4: '#94A3B8',
  border: '#E2E8F0',
  surface: '#F8FAFC',
  amber50: '#FFFBEB',
  amberBorder: '#FDE68A',
  amber800: '#92400E',
  green50: '#ECFDF5',
  greenBorder: '#6EE7B7',
  green600: '#059669',
};

// ─── Shared input style ───────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', height: 48, border: `1.5px solid ${C.border}`,
  borderRadius: 11, fontSize: 14, fontFamily: 'inherit',
  color: C.ink, background: C.surface, boxSizing: 'border-box',
  padding: '0 12px 0 42px', outline: 'none',
  transition: 'border-color .15s, box-shadow .15s, background .15s',
};

// ─── Field ────────────────────────────────────────────────────────
const Field: React.FC<{
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}> = ({ label, required, hint, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: C.ink4 }}>
      {label}
      {required && <span style={{ color: C.cyan, marginLeft: 3 }}>*</span>}
    </label>
    {children}
    {hint && <p style={{ fontSize: 11, color: C.ink4, marginTop: 2 }}>{hint}</p>}
  </div>
);

// ─── Icon inside input ────────────────────────────────────────────
const InputIcon: React.FC<{ children: React.ReactNode; alignTop?: boolean }> = ({ children, alignTop }) => (
  <div style={{
    position: 'absolute', left: 12,
    top: alignTop ? 13 : '50%',
    transform: alignTop ? 'none' : 'translateY(-50%)',
    color: C.ink4, pointerEvents: 'none', display: 'flex',
  }}>
    {children}
  </div>
);

// ─── Cyan button ─────────────────────────────────────────────────
const BtnCyan: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { wide?: boolean }> = ({ children, wide, style, ...p }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      {...p}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        width: wide ? '100%' : undefined, height: 48, padding: '0 24px',
        background: hov && !p.disabled ? C.cyanHover : C.cyan,
        color: '#fff', border: 'none', borderRadius: 11,
        fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
        cursor: p.disabled ? 'not-allowed' : 'pointer',
        opacity: p.disabled ? 0.6 : 1,
        transition: 'background .15s',
        ...style,
      }}
    >
      {children}
    </button>
  );
};

// ─── Main ─────────────────────────────────────────────────────────
export default function OrganizerProfilePage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const [form, setForm] = useState({
    full_name: '',
    organization_name: '',
    position: '',
    phone: '',
    website: '',
    bio: ''
  });

  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [pwSaving, setPwSaving] = useState(false);

  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarLoading(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const { data } = await usersApi.updateAvatar(formData);
      if (data.success) {
        toast.success('Cập nhật ảnh đại diện thành công');
        const newAvatar = data.data.avatar;
        setProfile((prev: any) => ({ ...prev, avatar: newAvatar }));
        updateUser({ avatar: newAvatar });
      } else {
        toast.error(data.message || 'Cập nhật thất bại');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi tải ảnh');
    } finally {
      setAvatarLoading(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await usersApi.getOrganizerProfile();
        if (data.success && data.data) {
          setProfile(data.data);
          // Sync with AuthContext in case it's stale
          if (data.data.avatar !== user?.avatar) {
            updateUser({ avatar: data.data.avatar });
          }
          setForm({
            full_name: data.data.full_name || '',
            organization_name: data.data.organization_name || '',
            position: data.data.position || '',
            phone: data.data.phone || '',
            website: data.data.website || '',
            bio: data.data.bio || ''
          });
        }
      } catch (err) {
        toast.error('Không thể tải thông tin hồ sơ Organizer');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePwChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPwForm({ ...pwForm, [e.target.name]: e.target.value });
  };

  const handlePwSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwForm.old_password || !pwForm.new_password || !pwForm.confirm_password) {
      return toast.error('Vui lòng điền đầy đủ thông tin mật khẩu');
    }
    if (pwForm.new_password !== pwForm.confirm_password) {
      return toast.error('Mật khẩu mới và nhập lại không khớp');
    }
    if (pwForm.new_password.length < 6) {
      return toast.error('Mật khẩu mới phải có ít nhất 6 ký tự');
    }
    setPwSaving(true);
    try {
      const { data } = await usersApi.changePassword({
        old_password: pwForm.old_password,
        new_password: pwForm.new_password
      });
      if (data.success) {
        toast.success('Đổi mật khẩu thành công');
        setPwForm({ old_password: '', new_password: '', confirm_password: '' });
      } else {
        toast.error(data.message || 'Thất bại');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi kết nối');
    } finally {
      setPwSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await usersApi.updateOrganizerProfile(form);
      if (data.success) {
        toast.success('Cập nhật hồ sơ thành công');
        setProfile({ ...profile, ...form });
      } else {
        toast.error(data.message || 'Cập nhật thất bại');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi kết nối');
    } finally {
      setSaving(false);
    }
  };

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const getFocusStyle = (id: string): React.CSSProperties =>
    focusedField === id
      ? { borderColor: C.cyan, background: '#fff', boxShadow: `0 0 0 3px rgba(0,204,255,0.12)` }
      : {};

  const inputProps = (id: string) => ({
    onFocus: () => setFocusedField(id),
    onBlur: () => setFocusedField(null),
    style: { ...inputStyle, ...getFocusStyle(id) } as React.CSSProperties,
  });

  const textareaProps = (id: string) => ({
    onFocus: () => setFocusedField(id),
    onBlur: () => setFocusedField(null),
    style: {
      ...inputStyle, height: 96, padding: '11px 12px 11px 42px',
      resize: 'none' as const, ...getFocusStyle(id),
    },
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48, minHeight: '60vh' }}>
        <Loader2 size={32} style={{ color: C.cyan, animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const isApproved = profile?.approval_status === 'approved';

  return (
    <div style={{ maxWidth: '100%', fontFamily: 'inherit' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start' }}>
        
        {/* Left Column (Sidebar-like) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Avatar Card */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <div 
                onClick={avatarLoading ? undefined : handleAvatarClick}
                style={{ 
                  width: 140, height: 140, borderRadius: '50%', background: C.surface, 
                  border: `2px solid ${C.white}`, boxShadow: `0 0 0 2px ${C.cyan}`, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  overflow: 'hidden', cursor: avatarLoading ? 'default' : 'pointer',
                  position: 'relative'
                }}
              >
                {profile?.avatar ? (
                  <img src={profile.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <img src="/assets/logo/default.jpg" alt="Default Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                )}
                
                {avatarLoading && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 size={32} style={{ color: C.cyan, animation: 'spin 1s linear infinite' }} />
                  </div>
                )}
              </div>

              <button 
                onClick={handleAvatarClick}
                disabled={avatarLoading}
                style={{ 
                  position: 'absolute', bottom: 6, right: 6, width: 38, height: 38, 
                  borderRadius: '50%', background: C.white, border: `1.5px solid ${C.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: C.cyan, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                <Camera size={20} />
              </button>

              <input type="file" ref={fileInputRef} onChange={handleAvatarChange} style={{ display: 'none' }} accept="image/*" />
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 800, color: C.ink, margin: '0 0 4px 0' }}>{form.organization_name || 'Tổ chức chưa đặt tên'}</h3>
            <p style={{ fontSize: 13, color: C.ink4, margin: '0 0 16px 0' }}>{user?.email}</p>

            <div style={{ 
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, 
              background: isApproved ? C.green50 : C.amber50, 
              color: isApproved ? C.green600 : C.amber800, 
              border: `1px solid ${isApproved ? C.greenBorder : C.amberBorder}`,
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px'
            }}>
              {isApproved ? <BadgeCheck size={14} /> : <AlertCircle size={14} />}
              {isApproved ? 'Đã xác minh' : 'Chờ xét duyệt'}
            </div>
          </div>

          {/* Password Card */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 800, color: C.ink, margin: '0 0 16px 0' }}>
              <Lock size={16} /> Đổi mật khẩu
            </h3>
            <form onSubmit={handlePwSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field label="Mật khẩu cũ">
                <div style={{ position: 'relative' }}>
                  <InputIcon><Key size={14} /></InputIcon>
                  <input type="password" name="old_password" placeholder="••••••••" value={pwForm.old_password} onChange={handlePwChange} {...inputProps('old_p')} style={{ ...inputProps('old_p').style, height: 42 }} />
                </div>
              </Field>
              <Field label="Mật khẩu mới">
                <div style={{ position: 'relative' }}>
                  <InputIcon><Lock size={14} /></InputIcon>
                  <input type="password" name="new_password" placeholder="Tối thiểu 6 ký tự" value={pwForm.new_password} onChange={handlePwChange} {...inputProps('new_p')} style={{ ...inputProps('new_p').style, height: 42 }} />
                </div>
              </Field>
              <Field label="Nhập lại mật khẩu mới">
                <div style={{ position: 'relative' }}>
                  <InputIcon><BadgeCheck size={14} /></InputIcon>
                  <input type="password" name="confirm_password" placeholder="Xác nhận lại" value={pwForm.confirm_password} onChange={handlePwChange} {...inputProps('confirm_p')} style={{ ...inputProps('confirm_p').style, height: 42 }} />
                </div>
              </Field>
              <BtnCyan type="submit" disabled={pwSaving} style={{ height: 42, marginTop: 4 }}>
                {pwSaving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Cập nhật mật khẩu'}
              </BtnCyan>
            </form>
          </div>
        </div>

        {/* Right Column (Details) */}
        <div style={{ background: '#fff', borderRadius: 20, padding: '32px 40px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: C.ink, margin: '0 0 24px 0', paddingBottom: 12, borderBottom: `1px solid ${C.border}` }}>
            Chi tiết thông tin tổ chức
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Người đại diện" required>
                <div style={{ position: 'relative' }}>
                  <InputIcon><User size={15} /></InputIcon>
                  <input type="text" name="full_name" required placeholder="Họ và tên" value={form.full_name} onChange={handleChange} {...inputProps('full_name')} />
                </div>
              </Field>

              <Field label="Tên tổ chức / Khoa" required>
                <div style={{ position: 'relative' }}>
                  <InputIcon><Building2 size={15} /></InputIcon>
                  <input type="text" name="organization_name" required placeholder="CLB CNTT" value={form.organization_name} onChange={handleChange} {...inputProps('organization_name')} />
                </div>
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Chức vụ">
                <div style={{ position: 'relative' }}>
                  <InputIcon><Briefcase size={15} /></InputIcon>
                  <input type="text" name="position" placeholder="Trưởng ban" value={form.position} onChange={handleChange} {...inputProps('position')} />
                </div>
              </Field>

              <Field label="Số điện thoại">
                <div style={{ position: 'relative' }}>
                  <InputIcon><Phone size={15} /></InputIcon>
                  <input type="tel" name="phone" placeholder="0901..." value={form.phone} onChange={handleChange} {...inputProps('phone')} />
                </div>
              </Field>
            </div>

            <Field label="Website / Facebook / LinkedIn">
              <div style={{ position: 'relative' }}>
                <InputIcon><Globe size={15} /></InputIcon>
                <input type="url" name="website" placeholder="https://..." value={form.website} onChange={handleChange} {...inputProps('website')} />
              </div>
            </Field>

            <Field label="Giới thiệu về tổ chức">
              <div style={{ position: 'relative' }}>
                <InputIcon alignTop><FileText size={15} /></InputIcon>
                <textarea name="bio" placeholder="Viết giới thiệu ngắn về tổ chức của bạn..." value={form.bio} onChange={handleChange} {...textareaProps('bio')} style={{ ...textareaProps('bio').style, height: 120, paddingTop: 14 }} />
              </div>
            </Field>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
              <BtnCyan type="submit" disabled={saving}>
                {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={18} />}
                Lưu tất cả thay đổi
              </BtnCyan>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
