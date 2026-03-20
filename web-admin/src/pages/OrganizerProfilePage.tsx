import React, { useState, useEffect } from 'react';
import { usersApi } from '../api/usersApi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Loader2, Save, User, Building2, Phone, Globe, FileText, BadgeCheck, AlertCircle } from 'lucide-react';

const OrganizerProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const [formData, setFormData] = useState({
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
          setFormData({
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await usersApi.updateOrganizerProfile(formData);
      if (data.success) {
        toast.success('Cập nhật hồ sơ thành công');
        setProfile({ ...profile, ...formData });
      } else {
        toast.error(data.message || 'Cập nhật thất bại');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi kết nối');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const isApproved = profile?.approval_status === 'approved';

  return (
    <div className="p-6 max-w-4xl mx-auto font-[Outfit]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <User className="text-primary w-6 h-6" />
          Hồ Sơ Ban Tổ Chức
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Quản lý thông tin tổ chức, liên hệ và giới thiệu
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="font-semibold text-lg text-slate-800">Trạng thái xác minh</h2>
            <p className="text-sm text-slate-500 mt-0.5">Tài khoản này đang được hệ thống ghi nhận dưới trạng thái:</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${isApproved ? 'bg-green-100/50 text-green-700 border border-green-200' : 'bg-orange-100/50 text-orange-700 border border-orange-200'}`}>
            {isApproved ? <BadgeCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {isApproved ? 'Đã xác minh (Organizer)' : 'Chờ xét duyệt'}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Họ và tên *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text" required name="full_name"
                  value={formData.full_name} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-700"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email liên hệ hệ thống</label>
              <div className="relative">
                <input
                  type="email" disabled
                  value={user?.email || profile?.email || ''}
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                />
                <div className="absolute top-2.5 right-3 text-xs font-semibold text-slate-400 bg-slate-200 px-2 py-0.5 rounded">
                  Chỉ đọc
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100 my-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tên tổ chức / CLB / Khoa *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text" required name="organization_name"
                  value={formData.organization_name} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Chức vụ trong tổ chức</label>
              <input
                type="text" name="position"
                value={formData.position} onChange={handleChange}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-700"
                placeholder="Ví dụ: Trưởng ban Truyền thông"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Số điện thoại liên hệ</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel" name="phone"
                  value={formData.phone} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-700"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Website / Mạng xã hội</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Globe className="w-4 h-4" />
                </div>
                <input
                  type="url" name="website"
                  value={formData.website} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-700"
                  placeholder="https://facebook.com/clb..."
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Giới thiệu ngắn gọn</label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none text-slate-400">
                  <FileText className="w-4 h-4" />
                </div>
                <textarea
                  name="bio" rows={4}
                  value={formData.bio} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-slate-700 resize-y"
                  placeholder="Viết một chút về Tổ chức/CLB của bạn..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-medium py-2.5 px-6 rounded-xl transition-colors shadow-sm disabled:opacity-70"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Lưu thay đổi hồ sơ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrganizerProfilePage;
