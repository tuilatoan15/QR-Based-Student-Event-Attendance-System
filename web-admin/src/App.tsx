import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import AdminLayout from './layouts/AdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EventsPage from './pages/EventsPage';
import CreateEventPage from './pages/CreateEventPage';
import EditEventPage from './pages/EditEventPage';
import EventRegistrationsPage from './pages/EventRegistrationsPage';
import QRScannerPage from './pages/QRScannerPage';
import AttendanceHistoryPage from './pages/AttendanceHistoryPage';
import EventDetailPage from './pages/EventDetailPage';
import AttendancePage from './pages/AttendancePage';
import UsersPage from './pages/UsersPage';
import RegisterOrganizerPage from './pages/RegisterOrganizerPage';
import OrganizerApprovalPage from './pages/OrganizerApprovalPage';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register-organizer" element={<RegisterOrganizerPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/create" element={<CreateEventPage />} />
        <Route path="events/:id" element={<EventDetailPage />} />
        <Route path="events/:id/edit" element={<EditEventPage />} />
        <Route
          path="events/:id/participants"
          element={<EventRegistrationsPage />}
        />
        <Route path="qr-scanner" element={<QRScannerPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route
          path="attendance/event/:id"
          element={<AttendanceHistoryPage />}
        />
        <Route path="users" element={<UsersPage />} />
        <Route path="organizers" element={<OrganizerApprovalPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;

