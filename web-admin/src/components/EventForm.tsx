import React, { useState } from 'react';
import type { Event } from '../api/eventApi';

type Props = {
  initial?: Partial<Event>;
  onSubmit: (values: {
    title: string;
    description?: string;
    location: string;
    start_time: string;
    end_time: string;
    max_participants: number;
    category_id?: number | null;
  }) => Promise<void>;
};

const EventForm: React.FC<Props> = ({ initial, onSubmit }) => {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [startTime, setStartTime] = useState(initial?.start_time ? initial.start_time.substring(0, 16) : '');
  const [endTime, setEndTime] = useState(initial?.end_time ? initial.end_time.substring(0, 16) : '');
  const [maxParticipants, setMaxParticipants] = useState(initial?.max_participants ?? 50);
  const [categoryId, setCategoryId] = useState<number | ''>(initial?.category_id ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        title, description, location,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        max_participants: maxParticipants,
        category_id: categoryId === '' ? undefined : Number(categoryId),
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Lưu thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{`
        .ef-form{display:flex;flex-direction:column;gap:0;}
        .ef-err{display:flex;align-items:flex-start;gap:8px;background:#fff1f2;border:1px solid #fecaca;border-radius:10px;padding:11px 14px;font-size:13px;color:#be123c;margin-bottom:24px;}
        .ef-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px 20px;margin-bottom:24px;}
        @media(max-width:640px){.ef-grid{grid-template-columns:1fr;}}
        .ef-full{grid-column:1/-1;}
        .ef-field{display:flex;flex-direction:column;gap:7px;}
        .ef-label{font-size:13px;font-weight:600;color:#374151;}
        .ef-label-hint{font-size:11.5px;color:#94a3b8;font-weight:400;margin-left:4px;}
        .ef-input,.ef-textarea,.ef-select{
          padding:10px 14px;
          background:#f8fafc;
          border:1.5px solid #e2e8f0;
          border-radius:9px;
          font-size:14px;
          font-family:inherit;
          color:#0f172a;
          outline:none;
          transition:border-color .15s,box-shadow .15s,background .15s;
          width:100%;
          box-sizing:border-box;
        }
        .ef-input::placeholder,.ef-textarea::placeholder{color:#cbd5e1;}
        .ef-input:focus,.ef-textarea:focus,.ef-select:focus{
          background:#fff;border-color:#0ea5e9;
          box-shadow:0 0 0 3px rgba(14,165,233,.15);
        }
        .ef-textarea{resize:vertical;min-height:88px;}
        .ef-footer{display:flex;align-items:center;gap:12px;padding-top:4px;}
        .ef-submit{display:inline-flex;align-items:center;gap:8px;padding:11px 24px;background:linear-gradient(135deg,#38bdf8,#0284c7);color:#fff;border:none;border-radius:9px;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer;transition:all .15s;box-shadow:0 3px 12px rgba(14,165,233,.35);}
        .ef-submit:hover:not(:disabled){opacity:.9;transform:translateY(-1px);box-shadow:0 5px 18px rgba(14,165,233,.45);}
        .ef-submit:disabled{opacity:.6;cursor:not-allowed;}
        .ef-spin{width:15px;height:15px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:ef-spin .65s linear infinite;}
        @keyframes ef-spin{to{transform:rotate(360deg)}}
      `}</style>

      <form onSubmit={handleSubmit} className="ef-form">
        {error && (
          <div className="ef-err">
            <svg viewBox="0 0 16 16" fill="currentColor" width="14" height="14" style={{flexShrink:0,marginTop:1}}>
              <path fillRule="evenodd" d="M8 1a7 7 0 100 14A7 7 0 008 1zM7 5a1 1 0 012 0v3a1 1 0 01-2 0V5zm1 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd"/>
            </svg>
            {error}
          </div>
        )}

        <div className="ef-grid">
          <div className="ef-field ef-full">
            <label className="ef-label">Tên sự kiện <span style={{color:'#f87171'}}>*</span></label>
            <input type="text" className="ef-input" placeholder="VD: Workshop React 2026" value={title} onChange={e=>setTitle(e.target.value)} required/>
          </div>

          <div className="ef-field ef-full">
            <label className="ef-label">Mô tả <span className="ef-label-hint">(tuỳ chọn)</span></label>
            <textarea className="ef-textarea" placeholder="Mô tả ngắn về sự kiện..." value={description} onChange={e=>setDescription(e.target.value)}/>
          </div>

          <div className="ef-field ef-full">
            <label className="ef-label">Địa điểm <span style={{color:'#f87171'}}>*</span></label>
            <input type="text" className="ef-input" placeholder="VD: Phòng 112, Nhà A" value={location} onChange={e=>setLocation(e.target.value)} required/>
          </div>

          <div className="ef-field">
            <label className="ef-label">Thời gian bắt đầu <span style={{color:'#f87171'}}>*</span></label>
            <input type="datetime-local" className="ef-input" value={startTime} onChange={e=>setStartTime(e.target.value)} required/>
          </div>

          <div className="ef-field">
            <label className="ef-label">Thời gian kết thúc <span style={{color:'#f87171'}}>*</span></label>
            <input type="datetime-local" className="ef-input" value={endTime} onChange={e=>setEndTime(e.target.value)} required/>
          </div>

          <div className="ef-field">
            <label className="ef-label">Số lượng tối đa <span style={{color:'#f87171'}}>*</span></label>
            <input type="number" min={1} className="ef-input" value={maxParticipants} onChange={e=>setMaxParticipants(Number(e.target.value))} required/>
          </div>

          <div className="ef-field">
            <label className="ef-label">Category ID <span className="ef-label-hint">(tuỳ chọn)</span></label>
            <input type="number" className="ef-input" placeholder="Để trống nếu không có" value={categoryId} onChange={e=>setCategoryId(e.target.value===''?'':Number(e.target.value))}/>
          </div>
        </div>

        <div className="ef-footer">
          <button type="submit" disabled={submitting} className="ef-submit">
            {submitting ? <><span className="ef-spin"/>Đang lưu...</> : <>
              <svg viewBox="0 0 16 16" fill="none" width="14" height="14">
                <path d="M2 9l4 4 8-8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {initial?.title ? 'Cập nhật sự kiện' : 'Tạo sự kiện'}
            </>}
          </button>
        </div>
      </form>
    </>
  );
};

export default EventForm;