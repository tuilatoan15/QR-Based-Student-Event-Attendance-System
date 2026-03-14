import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import EventForm from '../components/EventForm';
import { eventApi } from '../api/eventApi';

const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit: React.ComponentProps<typeof EventForm>['onSubmit'] = async (values) => {
    await eventApi.createEvent(values as any);
    navigate('/events');
  };

  return (
    <>
      <style>{`
        .cep-header{display:flex;align-items:center;gap:14px;margin-bottom:28px;flex-wrap:wrap;}
        .cep-back{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;background:#f0f7ff;border:1px solid #e0eeff;border-radius:8px;font-size:13px;font-weight:500;color:#0284c7;text-decoration:none;transition:all .14s;}
        .cep-back:hover{background:#e0f2fe;color:#0369a1;}
        .cep-title-wrap{flex:1;}
        .cep-title{font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-.5px;}
        .cep-subtitle{font-size:13px;color:#94a3b8;margin-top:3px;}
        .cep-card{background:#fff;border-radius:14px;border:1px solid #e0eeff;box-shadow:0 1px 4px rgba(14,165,233,.06),0 4px 16px rgba(14,165,233,.05);padding:28px 28px;}
      `}</style>

      <div>
        <div className="cep-header">
          <Link to="/events" className="cep-back">
            <svg viewBox="0 0 14 14" fill="none" width="13" height="13">
              <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Quay lại
          </Link>
          <div className="cep-title-wrap">
            <div className="cep-title">Tạo sự kiện mới</div>
            <div className="cep-subtitle">Điền thông tin để tạo sự kiện mới trong hệ thống</div>
          </div>
        </div>

        <div className="cep-card">
          <EventForm onSubmit={handleSubmit} />
        </div>
      </div>
    </>
  );
};

export default CreateEventPage;