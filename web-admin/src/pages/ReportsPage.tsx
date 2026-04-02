import React, { useEffect, useState } from 'react';
import reportApi, { type Report } from '../api/reportApi';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  Send
} from 'lucide-react';

const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredReports = reports.filter(r => {
    const typeMatch = filterType === 'all' || r.type === filterType;
    const statusMatch = filterStatus === 'all' || r.status === filterStatus;
    return typeMatch && statusMatch;
  });

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await reportApi.getAll();
      setReports(res.data.data);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleReply = async () => {
    if (!selectedReport || !replyText.trim()) return;

    try {
      setIsSubmitting(true);
      await reportApi.reply(selectedReport.mongo_id, replyText);
      setReplyText('');
      setSelectedReport(null);
      fetchReports();
    } catch (err) {
      console.error('Failed to send reply:', err);
      alert('Gửi phản hồi thất bại, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            <Clock size={12} /> Chờ xử lý
          </span>
        );
      case 'responded':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle2 size={12} /> Đã phản hồi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="text-primary" size={22} />
            Phản hồi & Báo lỗi
          </h1>
          <p className="text-[12px] text-gray-500 mt-0.5">
            Xem và xử lý ý kiến, báo lỗi từ người dùng di động.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs font-semibold py-2 pl-3 pr-8 rounded-lg border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
          >
            <option value="all">Tất cả loại</option>
            <option value="Báo lỗi hệ thống (Bug)">Báo lỗi</option>
            <option value="Hỗ trợ chung">Góp ý</option>
          </select>

          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs font-semibold py-2 pl-3 pr-8 rounded-lg border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="responded">Đã phản hồi</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
          <MessageSquare size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">Không tìm thấy phản hồi nào phù hợp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
          {filteredReports.map((report) => (
            <div 
              key={report.id} 
              className={`bg-white rounded-xl border p-4 shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer group flex flex-col h-full ${
                selectedReport?.id === report.id ? 'border-sky-500 ring-2 ring-sky-500/5' : 'border-slate-200'
              }`}
              onClick={() => setSelectedReport(report)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-100 shrink-0">
                    {report.user.avatar ? (
                      <img src={report.user.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                        {report.user.full_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="min-width-0">
                    <div className="font-bold text-gray-900 text-sm truncate max-w-[150px] uppercase tracking-tight">{report.user.full_name}</div>
                    <div className="text-[11px] text-gray-400 font-medium flex items-center gap-1.5 mt-0.5">
                      <span className="text-slate-500">{report.user.student_code}</span>
                      <span>•</span>
                      <span className="truncate">{new Date(report.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </div>
                {getStatusBadge(report.status)}
              </div>

              <div className="flex-1">
                <div className="mb-3 bg-slate-50/50 p-3 rounded-lg border border-slate-50">
                  <div className={`text-[10px] font-black uppercase tracking-[1px] mb-1.5 px-0.5 ${
                    report.type === 'Báo lỗi hệ thống (Bug)' ? 'text-rose-500' : 'text-sky-500'
                  }`}>
                    {report.type === 'Báo lỗi hệ thống (Bug)' ? 'Báo lỗi' : 'Góp ý'}
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mb-1.5 line-clamp-1">{report.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">{report.content}</p>
                </div>

                {report.admin_reply && (
                  <div className="mt-auto pt-3 border-t border-dashed border-slate-200">
                    <div className="flex items-start gap-2">
                       <div className="h-6 w-6 rounded bg-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 size={12} className="text-white" />
                      </div>
                      <div className="flex-1 min-width-0">
                        <div className="text-[10px] font-black text-emerald-600 uppercase mb-1">Đã trả lời</div>
                        <p className="text-gray-700 text-[13px] italic line-clamp-2 bg-emerald-50/30 p-2 rounded border border-emerald-50">"{report.admin_reply}"</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply Modal */}
      {selectedReport && selectedReport.status === 'pending' && (
        <div className="fixed inset-0 bg-[#0f172a]/60 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden border border-gray-100 flex flex-col scale-in duration-200">
            <div className="p-7 border-b border-gray-100">
              <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Phản hồi người dùng</h2>
              <p className="text-sm text-gray-500 mt-1">Gửi câu trả lời cho: <span className="font-bold text-gray-700">{selectedReport.user.full_name}</span></p>
            </div>
            
            <div className="p-7 overflow-y-auto max-h-[70vh] space-y-6">
              <div>
                <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Nội dung yêu cầu</div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-gray-700 leading-relaxed italic relative">
                  <div className="absolute top-2 right-3 opacity-10"><MessageSquare size={40} /></div>
                  "{selectedReport.content}"
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Nội dung phản hồi</label>
                <textarea 
                  className="w-full rounded-xl border-gray-200 bg-white shadow-sm focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 min-h-[160px] text-sm p-4 text-gray-800 placeholder:text-gray-300 transition-all outline-none"
                  placeholder="Nhập nội dung trả lời chuyên nghiệp..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
              </div>
            </div>

            <div className="p-5 flex justify-end gap-3 bg-slate-50/50 border-t border-gray-100">
              <button 
                onClick={() => {
                  setSelectedReport(null);
                  setReplyText('');
                }}
                className="px-5 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
              >
                Hủy bỏ
              </button>
              <button 
                disabled={!replyText.trim() || isSubmitting}
                onClick={handleReply}
                className="px-8 py-2.5 bg-sky-600 text-white text-sm font-bold rounded-xl hover:bg-sky-700 disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-sky-600/30 transition-all active:scale-95"
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Send size={16} />
                )}
                Gửi phản hồi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
