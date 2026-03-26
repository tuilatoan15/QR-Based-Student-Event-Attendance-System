import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import type { Event } from '../api/eventApi';
import axiosClient from '../api/axiosClient';

type Props = {
  initial?: Partial<Event>;
  onSubmit: (values: FormData) => Promise<void>;
};

const EventForm: React.FC<Props> = ({ initial, onSubmit }) => {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const [startTime, setStartTime] = useState(initial?.start_time ? initial.start_time.substring(0, 16) : '');
  const [endTime, setEndTime] = useState(initial?.end_time ? initial.end_time.substring(0, 16) : '');
  const [maxParticipants, setMaxParticipants] = useState(initial?.max_participants ?? 50);
  const [categoryId, setCategoryId] = useState<number | ''>(initial?.category_id ?? '');
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quillRef = useRef<ReactQuill>(null);

  // Parse existing images if any
  const [existingImages, setExistingImages] = useState<string[]>([]);
  useEffect(() => {
    if (initial?.images) {
      try {
        setExistingImages(JSON.parse(initial.images));
      } catch (e) {}
    }
  }, [initial?.images]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => {
        const newFiles = [...prev, ...files];
        if (newFiles.length + existingImages.length > 10) {
          alert('Tối đa 10 hình ảnh');
          return prev;
        }
        
        const urls = files.map(file => URL.createObjectURL(file));
        setPreviewUrls(previewPrev => [...previewPrev, ...urls]);
        return newFiles;
      });
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };
  
  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('location', location);
      formData.append('start_time', new Date(startTime).toISOString());
      formData.append('end_time', new Date(endTime).toISOString());
      formData.append('max_participants', maxParticipants.toString());
      if (categoryId !== '') formData.append('category_id', categoryId.toString());
      
      if (description) {
        formData.append('description', description);
      }
      
      // Append existing images
      if (existingImages.length > 0) {
        formData.append('images', JSON.stringify(existingImages));
      } else if (selectedFiles.length === 0) {
        // If they cleared all images, we send an empty array string so backend knows to clear.
        formData.append('images', '[]');
      }

      // Append files
      if (selectedFiles.length > 0) {
        selectedFiles.forEach(file => {
          formData.append('images', file);
        });
      }

      await onSubmit(formData);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Lưu thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/jpeg, image/png, image/jpg');
    input.click();

    input.onchange = async () => {
      const file = input.files ? input.files[0] : null;
      if (!file) return;

      const fd = new FormData();
      fd.append('image', file);
      try {
        const res = await axiosClient.post('/upload/editor-image', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const url = res.data.url.startsWith('http') ? res.data.url : 'http://localhost:5000' + res.data.url;
        
        const quill = quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, 'image', url);
          quill.setSelection(range.index + 1, 0);
        }
      } catch (e) {
        console.error('Image upload failed', e);
        alert('Không thể tải ảnh lên. Vui lòng thử lại.');
      }
    };
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: { image: imageHandler }
    }
  }), []);

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
        .ef-file{font-size:13px;padding:8px;background:#fff;border:1.5px dashed #cbd5e1;border-radius:9px;cursor:pointer;color:#475569;}
        .ef-preview-grid{display:flex;gap:12px;margin-top:12px;flex-wrap:wrap;}
        .ef-preview-item{position:relative;width:80px;height:80px;border-radius:8px;border:1px solid #e2e8f0;overflow:hidden;}
        .ef-preview-img{width:100%;height:100%;object-fit:cover;}
        .ef-preview-rm{position:absolute;top:4px;right:4px;background:rgba(0,0,0,.5);color:#fff;border:none;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:11px;cursor:pointer;opacity:0;transition:opacity .15s;}
        .ef-preview-item:hover .ef-preview-rm{opacity:1;}
        .ef-preview-rm:hover{background:#ef4444;}
        
        .ql-container{font-family:inherit;font-size:14px;background:#fff;border-bottom-left-radius:9px;border-bottom-right-radius:9px;}
        .ql-toolbar{border-top-left-radius:9px;border-top-right-radius:9px;background:#f8fafc;}
        .ql-editor{min-height:160px;}

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
            <ReactQuill 
              ref={quillRef}
              theme="snow" 
              value={description} 
              onChange={setDescription} 
              modules={modules}
              placeholder="Nhập nội dung chi tiết sự kiện..."
            />
          </div>
          
          <div className="ef-field ef-full">
            <label className="ef-label">Hình ảnh <span className="ef-label-hint">(tối đa 10 ảnh)</span></label>
            <input 
              type="file" 
              multiple 
              accept="image/jpeg, image/png, image/jpg" 
              onChange={handleFileChange}
              className="ef-file"
              disabled={selectedFiles.length + existingImages.length >= 10}
            />
            <div className="ef-preview-grid">
              {existingImages.map((url, i) => (
                <div key={'ex_'+i} className="ef-preview-item">
                  <img src={url.startsWith('http') ? url : ("http://localhost:5000" + url)} className="ef-preview-img" alt="Existing" />
                  <button type="button" className="ef-preview-rm" onClick={() => removeExistingImage(i)}>✕</button>
                </div>
              ))}
              {previewUrls.map((url, i) => (
                <div key={'pr_'+i} className="ef-preview-item">
                  <img src={url} className="ef-preview-img" alt="Preview" />
                  <button type="button" className="ef-preview-rm" onClick={() => removeFile(i)}>✕</button>
                </div>
              ))}
            </div>
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