import React, { useState, useEffect } from 'react';
import { adminApi, type OrganizerInfo } from '../api/adminApi';
import toast from 'react-hot-toast';
import { Loader2, Check, X, ShieldAlert, CheckCircle, Clock } from 'lucide-react';

const OrganizerApprovalPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [organizers, setOrganizers] = useState<OrganizerInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  
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

  const handleApprove = async (id: number) => {
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

  const renderTabs = () => (
    <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl mb-8 w-fit border border-slate-200/60 shadow-inner">
      {[
        { id: 'pending', label: 'Chờ duyệt', icon: <Clock size={15} /> },
        { id: 'approved', label: 'Đã duyệt', icon: <CheckCircle size={15} /> },
        { id: 'rejected', label: 'Từ chối', icon: <X size={15} /> },
      ].map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13.5px] font-semibold transition-all duration-300 ${
              isActive 
                ? 'bg-white text-[#00CCFF] shadow-[0_4px_12px_rgba(0,0,0,0.06)]' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto min-h-screen">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00CCFF] to-[#0099CC] flex items-center justify-center text-white shadow-lg shadow-[#00CCFF]/20">
          <ShieldAlert size={24} strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Duyệt Organizer</h1>
          <p className="text-sm text-slate-500 mt-0.5">Quản lý xét duyệt tài khoản dành cho Ban tổ chức</p>
        </div>
      </div>

      {renderTabs()}

      {loading ? (
        <div className="flex justify-center items-center h-64 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <Loader2 className="w-8 h-8 text-[#00CCFF] animate-spin" />
        </div>
      ) : organizers.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-3xl border border-slate-100 shadow-sm text-center">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
            <ShieldAlert className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-base font-bold text-slate-700 mb-1">Không có dữ liệu</h3>
          <p className="text-[13.5px] text-slate-500 mb-0">Chưa có hồ sơ organizer nào trong danh sách này.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13.5px]">
              <thead className="bg-slate-50/50 border-b border-slate-100 text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                <tr>
                  <th className="px-6 py-5">Tài khoản</th>
                  <th className="px-6 py-5">Tổ chức</th>
                  <th className="px-6 py-5">Liên hệ</th>
                  <th className="px-6 py-5">Tóm tắt</th>
                  {activeTab === 'pending' && <th className="px-6 py-5 text-right">Hành động</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {organizers.map((org) => (
                  <tr key={org.user_id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="font-semibold text-slate-800">{org.full_name}</div>
                      <div className="text-[12.5px] text-slate-500 mt-0.5">{org.email}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-semibold text-slate-800">{org.organization_name}</div>
                      <div className="text-[12.5px] text-[#00CCFF] font-medium mt-0.5">{org.position || 'Không có chức vụ'}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-slate-600 tabular-nums">{org.phone || 'Không có SDT'}</div>
                      {org.website && (
                        <a href={org.website} target="_blank" rel="noreferrer" className="text-[12px] text-[#00CCFF] hover:underline font-medium mt-1 block">
                          Mở Website
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-slate-600 max-w-[250px] line-clamp-2 leading-relaxed" title={org.bio || ''}>
                        {org.bio || '—'}
                      </p>
                    </td>
                    {activeTab === 'pending' && (
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleApprove(org.user_id)}
                            disabled={processingId === org.user_id}
                            className="bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Check size={16} strokeWidth={2.5} /> Duyệt
                          </button>
                          <button
                            onClick={() => openRejectModal(org)}
                            disabled={processingId === org.user_id}
                            className="bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <X size={16} strokeWidth={2.5} /> Từ chối
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && selectedOrganizer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="px-7 pt-7 pb-5">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
                <X size={24} strokeWidth={2.5} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Từ chối Organizer</h3>
              <p className="text-[14.5px] text-slate-500 leading-relaxed mb-6">
                Bạn đang từ chối yêu cầu của <strong className="text-slate-800">{selectedOrganizer.full_name}</strong> ({selectedOrganizer.organization_name}). Hành động này không thể hoàn tác.
              </p>

              <label className="block text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-2">Lý do từ chối *</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full text-[14.5px] rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-rose-200 focus:border-rose-400 p-4 outline-none transition-all resize-none placeholder-slate-400 text-slate-800"
                rows={3}
                placeholder="Ví dụ: Thiếu thông tin liên hệ, chức vụ không rõ ràng..."
                autoFocus
              />
            </div>
            <div className="p-5 flex justify-end gap-2.5 bg-slate-50/50 border-t border-slate-100">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-5 py-2.5 text-[14px] font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                disabled={processingId === selectedOrganizer.user_id}
              >
                Hủy
              </button>
              <button
                onClick={handleReject}
                disabled={processingId === selectedOrganizer.user_id}
                className="px-5 py-2.5 text-[14px] font-semibold text-white bg-rose-500 hover:bg-rose-600 active:scale-[0.98] rounded-xl transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {processingId === selectedOrganizer.user_id && <Loader2 className="w-4 h-4 animate-spin" />}
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
