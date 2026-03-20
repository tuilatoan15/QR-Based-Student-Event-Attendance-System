import React, { useState, useEffect } from 'react';
import { usersApi } from '../api/usersApi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Loader2, Save, User, Building2, Phone, Globe, FileText, BadgeCheck, AlertCircle, Mail, Briefcase } from 'lucide-react';

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
  const { user } = useAuth();
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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await usersApi.getOrganizerProfile();
        if (data.success && data.data) {
          setProfile(data.data);
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
    <div style={{ maxWidth: 840, fontFamily: 'inherit' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 26, fontWeight: 800, color: C.ink, letterSpacing: '-0.6px', margin: 0 }}>
          <User style={{ color: C.cyan }} size={26} strokeWidth={2.5} />
          Hồ Sơ Ban Tổ Chức
        </h1>
        <p style={{ fontSize: 14, color: C.ink4, marginTop: 6, margin: 0 }}>
          Quản lý thông tin tổ chức, liên hệ và giới thiệu
        </p>
      </div>

      <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 32px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        
        {/* Status bar */}
        <div style={{ padding: '20px 32px', borderBottom: `1px solid ${C.border}`, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: C.ink, margin: 0 }}>Trạng thái xác minh</h2>
            <p style={{ fontSize: 13, color: C.ink3, marginTop: 4, margin: 0 }}>Tài khoản này đang được ghi nhận dưới trạng thái:</p>
          </div>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 10, 
            background: isApproved ? C.green50 : C.amber50, 
            color: isApproved ? C.green600 : C.amber800, 
            border: `1px solid ${isApproved ? C.greenBorder : C.amberBorder}`,
            fontSize: 13, fontWeight: 700 
          }}>
            {isApproved ? <BadgeCheck size={18} /> : <AlertCircle size={18} />}
            {isApproved ? 'Đã xác minh' : 'Chờ xét duyệt'}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            <Field label="Người đại diện" required>
              <div style={{ position: 'relative' }}>
                <InputIcon><User size={15} /></InputIcon>
                <input type="text" name="full_name" required placeholder="Họ và tên" value={form.full_name} onChange={handleChange} {...inputProps('full_name')} />
              </div>
            </Field>

            <Field label="Email liên hệ hệ thống">
              <div style={{ position: 'relative' }}>
                <InputIcon><Mail size={15} /></InputIcon>
                <input type="email" disabled value={user?.email || profile?.email || ''} 
                  style={{ ...inputStyle, background: C.surface, color: C.ink4, cursor: 'not-allowed', borderColor: C.border }} 
                />
                <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 11, fontWeight: 700, color: C.ink4, background: C.border, padding: '2px 6px', borderRadius: 6 }}>
                  Chỉ đọc
                </div>
              </div>
            </Field>
          </div>

          <div style={{ height: 1, width: '100%', background: C.border }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Tên tổ chức / Khoa" required>
              <div style={{ position: 'relative' }}>
                <InputIcon><Building2 size={15} /></InputIcon>
                <input type="text" name="organization_name" required placeholder="CLB CNTT" value={form.organization_name} onChange={handleChange} {...inputProps('organization_name')} />
              </div>
            </Field>

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
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
            <Field label="Website / Mạng xã hội">
              <div style={{ position: 'relative' }}>
                <InputIcon><Globe size={15} /></InputIcon>
                <input type="url" name="website" placeholder="https://..." value={form.website} onChange={handleChange} {...inputProps('website')} />
              </div>
            </Field>

            <Field label="Giới thiệu ngắn">
              <div style={{ position: 'relative' }}>
                <InputIcon alignTop><FileText size={15} /></InputIcon>
                <textarea name="bio" placeholder="Viết một chút về tổ chức..." value={form.bio} onChange={handleChange} {...textareaProps('bio')} style={{ ...textareaProps('bio').style, height: 48 }} />
              </div>
            </Field>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
            <BtnCyan type="submit" disabled={saving}>
              {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
              Lưu thay đổi hồ sơ
            </BtnCyan>
          </div>
        </form>
      </div>
    </div>
  );
}
