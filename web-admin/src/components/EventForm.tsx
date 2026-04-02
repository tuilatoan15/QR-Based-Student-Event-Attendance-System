import React, { useMemo, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import type { Event } from '../api/eventApi';

type Props = {
  initial?: Partial<Event>;
  onSubmit: (values: Record<string, unknown>) => Promise<void>;
};

const EventForm: React.FC<Props> = ({ initial, onSubmit }) => {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [startTime, setStartTime] = useState(
    initial?.start_time ? initial.start_time.substring(0, 16) : ''
  );
  const [endTime, setEndTime] = useState(
    initial?.end_time ? initial.end_time.substring(0, 16) : ''
  );
  const [maxParticipants, setMaxParticipants] = useState(initial?.max_participants ?? 50);
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? '');
  const [banner, setBanner] = useState<string | null>(
    Array.isArray(initial?.images) ? (initial.images[0] ?? null) : (typeof initial?.images === 'string' ? initial.images : null)
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const quillRef = useRef<ReactQuill>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setBanner(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await onSubmit({
        title,
        description,
        location,
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString(),
        max_participants: maxParticipants,
        images: banner ? [banner] : [],
        ...(categoryId ? { category_id: categoryId } : {}),
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Lưu thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const imageHandler = () => {
    alert('Tính năng tải ảnh trong trình soạn chưa được hỗ trợ ở backend hiện tại.');
  };

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'image'],
          ['clean'],
        ],
        handlers: { image: imageHandler },
      },
    }),
    []
  );

  return (
    <>
      <style>{`
        .ef-form{display:flex;flex-direction:column;gap:0;}
        .ef-err{display:flex;align-items:flex-start;gap:8px;background:#fff1f2;border:1px solid #fecaca;border-radius:10px;padding:11px 14px;font-size:13px;color:#be123c;margin-bottom:24px;}
        .ef-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px 20px;margin-bottom:24px;}
        @media(max-width:640px){.ef-grid{grid-template-columns:1fr;}}
        .ef-full{grid-column:1/-1;}
        .ef-field{display:flex;flex-direction:column;gap:8px;margin-bottom:8px;}
        .ef-label{display:block;font-size:13.5px;font-weight:700;color:#1e293b;margin-bottom:2px;}
        .ef-label-hint{font-size:11.5px;color:#94a3b8;font-weight:400;margin-left:4px;}
        .ef-input{
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
        .ef-input::placeholder{color:#cbd5e1;}
        .ef-input:focus{
          background:#fff;border-color:#0ea5e9;
          box-shadow:0 0 0 3px rgba(14,165,233,.15);
        }
        .ef-field-editor{margin-bottom:32px;}
        .ql-container{font-family:inherit;font-size:14px;background:#fff;border-bottom-left-radius:9px;border-bottom-right-radius:9px;overflow:hidden;}
        .ql-toolbar{border-top-left-radius:9px;border-top-right-radius:9px;background:#f8fafc;}
        .ql-editor{min-height:160px;height:auto;}
        .ef-footer{display:flex;align-items:center;gap:12px;padding-top:4px;}
        .ef-submit{display:inline-flex;align-items:center;gap:8px;padding:11px 24px;background:linear-gradient(135deg,#38bdf8,#0284c7);color:#fff;border:none;border-radius:9px;font-size:14px;font-weight:600;font-family:inherit;cursor:pointer;transition:all .15s;box-shadow:0 3px 12px rgba(14,165,233,.35);}
        .ef-submit:hover:not(:disabled){opacity:.9;transform:translateY(-1px);box-shadow:0 5px 18px rgba(14,165,233,.45);}
        .ef-submit:disabled{opacity:.6;cursor:not-allowed;}
        .ef-spin{width:15px;height:15px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:ef-spin .65s linear infinite;}
        @keyframes ef-spin{to{transform:rotate(360deg)}}
        .ef-banner-preview{width:100%;height:180px;border-radius:10px;object-fit:cover;border:1px solid #e2e8f0;margin-bottom:8px;}
        .ef-banner-empty{width:100%;height:120px;border-radius:10px;border:2px dashed #e2e8f0;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:13px;background:#f8fafc;}
      `}</style>

      <form onSubmit={handleSubmit} className="ef-form">
        {error && <div className="ef-err">{error}</div>}

        <div className="ef-grid">
          <div className="ef-field ef-full">
            <label className="ef-label">Banner sự kiện (Chỉ duy nhất 1 ảnh)</label>
            {banner ? (
              <img src={banner.startsWith('data:') ? banner : (banner.startsWith('http') ? banner : `http://localhost:5000${banner}`)} className="ef-banner-preview" alt="Banner" />
            ) : (
              <div className="ef-banner-empty">Chưa có ảnh banner</div>
            )}
            <input type="file" accept="image/*" onChange={handleImageChange} className="ef-input" style={{ padding: '6px' }} />
          </div>

          <div className="ef-field ef-full">
            <label className="ef-label">Tên sự kiện</label>
            <input type="text" className="ef-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="ef-field ef-full ef-field-editor">
            <label className="ef-label">Mô tả</label>
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={description}
              onChange={setDescription}
              modules={modules}
            />
          </div>

          <div className="ef-field ef-full">
            <label className="ef-label">Địa điểm tổ chức</label>
            <input type="text" className="ef-input" placeholder="Nhập địa điểm (vd: Hội trường A, Sân vận động...)" value={location} onChange={(e) => setLocation(e.target.value)} required />
          </div>

          <div className="ef-field">
            <label className="ef-label">Thời gian bắt đầu</label>
            <input type="datetime-local" className="ef-input" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
          </div>

          <div className="ef-field">
            <label className="ef-label">Thời gian kết thúc</label>
            <input type="datetime-local" className="ef-input" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
          </div>

          <div className="ef-field">
            <label className="ef-label">Số lượng tối đa</label>
            <input type="number" min={1} className="ef-input" value={maxParticipants} onChange={(e) => setMaxParticipants(Number(e.target.value))} required />
          </div>

          <div className="ef-field">
            <label className="ef-label">
              Category ID <span className="ef-label-hint">(tùy chọn)</span>
            </label>
            <input type="text" className="ef-input" value={categoryId ?? ''} onChange={(e) => setCategoryId(e.target.value)} />
          </div>
        </div>

        <div className="ef-footer">
          <button type="submit" disabled={submitting} className="ef-submit">
            {submitting ? <><span className="ef-spin" />Đang lưu...</> : initial?.title ? 'Cập nhật sự kiện' : 'Tạo sự kiện'}
          </button>
        </div>
      </form>
    </>
  );
};

export default EventForm;
