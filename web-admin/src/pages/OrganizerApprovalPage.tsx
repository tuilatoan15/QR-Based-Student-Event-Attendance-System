import React, { useState, useEffect } from 'react';
import { adminApi, type OrganizerInfo } from '../api/adminApi';
import toast from 'react-hot-toast';
import { Loader2, Check, X, ShieldAlert, CheckCircle, Clock } from 'lucide-react';

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
  red50: '#FFF1F2',
  redBorder: '#FECACA',
  red700: '#B91C1C',
  green50: '#ECFDF5',
  greenBorder: '#6EE7B7',
  green600: '#059669',
};

// ─── Button Components ───────────────────────────────────────────
const BtnApprove: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, style, ...props }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      {...props}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 14px', borderRadius: 10,
        background: hov && !props.disabled ? C.green600 : C.green50,
        color: hov && !props.disabled ? '#fff' : C.green600,
        border: 'none', fontSize: 13, fontWeight: 700,
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.6 : 1, transition: 'all .2s', ...style
      }}
    >
      {children}
    </button>
  );
};

const BtnReject: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, style, ...props }) => {
  const [hov, setHov] = useState(false);
  return (
    <button
      {...props}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 14px', borderRadius: 10,
        background: hov && !props.disabled ? C.red700 : C.red50,
        color: hov && !props.disabled ? '#fff' : C.red700,
        border: 'none', fontSize: 13, fontWeight: 700,
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.6 : 1, transition: 'all .2s', ...style
      }}
    >
      {children}
    </button>
  );
};

const OrganizerApprovalPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [organizers, setOrganizers] = useState<OrganizerInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  // Modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedOrganizer, setSelectedOrganizer] = useState<OrganizerInfo | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchOrganizers = async (status: string) => {
    setLoading(true);
    try {
      const { data } = await adminApi.getOrganizers(status);
      setOrganizers(data.data || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi tải danh sách organizer');
      setOrganizers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizers(activeTab);
  }, [activeTab]);

  const handleApprove = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn phê duyệt tài khoản này?')) return;
    setProcessingId(id);
    try {
      const { data } = await adminApi.approveOrganizer(id);
      if (data.success) {
        toast.success('Phê duyệt thành công');
        fetchOrganizers(activeTab);
      } else {
        toast.error(data.message || 'Phê duyệt thất bại');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi kết nối');
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (org: OrganizerInfo) => {
    setSelectedOrganizer(org);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!selectedOrganizer) return;
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    setProcessingId(selectedOrganizer.user_id);
    try {
      const { data } = await adminApi.rejectOrganizer(selectedOrganizer.user_id, rejectReason.trim());
      if (data.success) {
        toast.success('Đã từ chối tài khoản');
        setRejectModalOpen(false);
        fetchOrganizers(activeTab);
      } else {
        toast.error(data.message || 'Thao tác thất bại');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi kết nối');
    } finally {
      setProcessingId(null);
    }
  };

  const tabs = [
    { id: 'pending', label: 'Chờ duyệt', icon: <Clock size={15} /> },
    { id: 'approved', label: 'Đã duyệt', icon: <CheckCircle size={15} /> },
    { id: 'rejected', label: 'Từ chối', icon: <X size={15} /> },
  ];

  return (
    <div style={{ fontFamily: 'inherit' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
        <div style={{
          width: 50, height: 50, borderRadius: 14,
          background: C.cyan, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 8px 24px ${C.cyan}40`
        }}>
          <ShieldAlert size={28} strokeWidth={2.5} />
        </div>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.ink, margin: '0 0 4px', letterSpacing: '-0.5px' }}>
            Duyệt Organizer
          </h1>
          <p style={{ fontSize: 14, color: C.ink4, margin: 0 }}>
            Kiểm tra và xét duyệt tài khoản Ban tổ chức đăng ký mới
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: C.surface, padding: 6, borderRadius: 14,
        marginBottom: 32, border: `1px solid ${C.border}`
      }}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 10,
                background: isActive ? '#fff' : 'transparent',
                color: isActive ? C.cyan : C.ink3,
                border: 'none', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', transition: 'all .25s',
                boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.06)' : 'none'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: 20, boxShadow: '0 4px 32px rgba(0,0,0,0.04)' }}>
          <Loader2 size={32} style={{ color: C.cyan, animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : organizers.length === 0 ? (
        <div style={{ 
          height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
          background: '#fff', borderRadius: 20, border: `1px dashed ${C.border}` 
        }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: C.surface, color: C.ink4, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <ShieldAlert size={32} strokeWidth={1.5} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 4 }}>Không có dữ liệu</h3>
          <p style={{ fontSize: 14, color: C.ink4 }}>Chưa có hồ sơ organizer nào trong trạng thái này.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 32px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>
                <tr>
                  <th style={{ padding: '16px 24px', color: C.ink4, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tài khoản</th>
                  <th style={{ padding: '16px 24px', color: C.ink4, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tổ chức / CLB / Khoa</th>
                  <th style={{ padding: '16px 24px', color: C.ink4, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Liên hệ</th>
                  <th style={{ padding: '16px 24px', color: C.ink4, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Giới thiệu</th>
                  {activeTab === 'pending' && <th style={{ padding: '16px 24px', textAlign: 'right', color: C.ink4, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hành động</th>}
                </tr>
              </thead>
              <tbody>
                {organizers.map((org, idx) => {
                  const isHov = hoveredRowId === org.user_id;
                  return (
                    <tr 
                      key={org.user_id} 
                      onMouseEnter={() => setHoveredRowId(org.user_id)} 
                      onMouseLeave={() => setHoveredRowId(null)}
                      style={{ 
                        borderBottom: idx === organizers.length - 1 ? 'none' : `1px solid ${C.surface}`,
                        background: isHov ? C.surface : '#fff',
                        transition: 'background .2s'
                      }}
                    >
                      <td style={{ padding: '18px 24px' }}>
                        <div style={{ fontWeight: 700, color: C.ink, marginBottom: 4 }}>{org.full_name}</div>
                        <div style={{ fontSize: 13, color: C.ink4 }}>{org.email}</div>
                      </td>
                      <td style={{ padding: '18px 24px' }}>
                        <div style={{ fontWeight: 700, color: C.ink, marginBottom: 4 }}>{org.organization_name}</div>
                        <div style={{ fontSize: 13, color: C.cyan, fontWeight: 600 }}>{org.position || '—'}</div>
                      </td>
                      <td style={{ padding: '18px 24px' }}>
                        <div style={{ color: C.ink3, fontWeight: 600, fontFamily: 'monospace', fontSize: 13, marginBottom: 4 }}>{org.phone || '—'}</div>
                        {org.website && (
                          <a href={org.website} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: C.cyan, fontWeight: 600, textDecoration: 'none' }}>
                            Mở Website
                          </a>
                        )}
                      </td>
                      <td style={{ padding: '18px 24px' }}>
                        <p style={{ color: C.ink3, fontSize: 13, lineHeight: 1.5, margin: 0, 
                                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} 
                           title={org.bio || ''}>
                          {org.bio || '—'}
                        </p>
                      </td>
                      {activeTab === 'pending' && (
                        <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, opacity: isHov ? 1 : 0.4, transition: 'opacity .2s' }}>
                            <BtnApprove onClick={() => handleApprove(org.user_id)} disabled={processingId === org.user_id}>
                              <Check size={16} strokeWidth={3} /> Duyệt
                            </BtnApprove>
                            <BtnReject onClick={() => openRejectModal(org)} disabled={processingId === org.user_id}>
                              <X size={16} strokeWidth={3} /> Từ chối
                            </BtnReject>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && selectedOrganizer && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(10, 15, 30, 0.4)', backdropFilter: 'blur(4px)', padding: 24
        }}>
          <div style={{
            background: '#fff', width: '100%', maxWidth: 440, borderRadius: 24,
            boxShadow: '0 24px 48px rgba(0,0,0,0.12)', overflow: 'hidden'
          }}>
            <div style={{ padding: '32px 32px 24px' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.red50, color: C.red700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <X size={28} strokeWidth={2.5} />
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: C.ink, marginBottom: 8 }}>Từ chối Organizer</h3>
              <p style={{ fontSize: 14, color: C.ink3, lineHeight: 1.6, marginBottom: 24 }}>
                Bạn đang từ chối yêu cầu của <strong style={{color: C.ink}}>{selectedOrganizer.full_name}</strong> ({selectedOrganizer.organization_name}).
              </p>

              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: C.ink4, marginBottom: 8 }}>
                Lý do từ chối *
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                autoFocus
                placeholder="Ví dụ: Thông tin không hợp lệ..."
                style={{
                  width: '100%', height: 100, padding: 16, borderRadius: 12,
                  border: `1.5px solid ${C.border}`, background: C.surface, color: C.ink,
                  fontSize: 14, fontFamily: 'inherit', resize: 'none', outline: 'none'
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = C.red700; e.currentTarget.style.background = '#fff'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.surface; }}
              />
            </div>
            
            <div style={{ padding: '20px 32px', background: C.surface, display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: `1px solid ${C.border}` }}>
              <button
                onClick={() => setRejectModalOpen(false)}
                disabled={processingId === selectedOrganizer.user_id}
                style={{
                  padding: '12px 20px', borderRadius: 12, background: 'transparent',
                  color: C.ink3, border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleReject}
                disabled={processingId === selectedOrganizer.user_id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '12px 24px', borderRadius: 12, background: C.red700,
                  color: '#fff', border: 'none', fontSize: 14, fontWeight: 700,
                  cursor: processingId === selectedOrganizer.user_id ? 'not-allowed' : 'pointer',
                  opacity: processingId === selectedOrganizer.user_id ? 0.6 : 1
                }}
              >
                {processingId === selectedOrganizer.user_id && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerApprovalPage;
