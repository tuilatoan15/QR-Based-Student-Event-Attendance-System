import 'dart:convert';

import 'package:flutter/foundation.dart';

import '../config/api_config.dart';
import '../models/event.dart';
import '../models/participant.dart';
import 'api_service.dart';

class OrganizerService extends ChangeNotifier {
  OrganizerService() : _api = ApiService(ApiConfig.baseUrl);

  final ApiService _api;

  List<Event> myEvents = [];
  List<Participant> participants = [];
  List<Participant> attendance = [];
  bool isLoading = false;
  String? errorMessage;

  // ─── Organizer Events ───────────────────────────────────────────────────────

  Future<void> fetchMyEvents() async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.get('/api/events/organizer/events', authenticated: true);
      final decoded = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200 && decoded['success'] == true) {
        final data = decoded['data'] as List<dynamic>? ?? [];
        myEvents = data.map((e) => Event.fromJson(e as Map<String, dynamic>)).toList();
      } else {
        errorMessage = decoded['message'] as String? ?? 'Lỗi tải sự kiện';
      }
    } catch (e) {
      errorMessage = 'Không thể tải sự kiện. Vui lòng thử lại.';
    }

    isLoading = false;
    notifyListeners();
  }

  Future<bool> createEvent(Map<String, dynamic> body) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.post('/api/events', body: body, authenticated: true);
      final decoded = jsonDecode(response.body) as Map<String, dynamic>;

      if ((response.statusCode == 200 || response.statusCode == 201) && decoded['success'] == true) {
        await fetchMyEvents();
        return true;
      } else {
        errorMessage = decoded['message'] as String? ?? 'Lỗi tạo sự kiện';
      }
    } catch (e) {
      errorMessage = 'Không thể tạo sự kiện. Vui lòng thử lại.';
    }

    isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> updateEvent(int id, Map<String, dynamic> body) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.put('/api/events/$id', body: body, authenticated: true);
      final decoded = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200 && decoded['success'] == true) {
        await fetchMyEvents();
        return true;
      } else {
        errorMessage = decoded['message'] as String? ?? 'Lỗi cập nhật sự kiện';
      }
    } catch (e) {
      errorMessage = 'Không thể cập nhật sự kiện. Vui lòng thử lại.';
    }

    isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> deleteEvent(int id) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.delete('/api/events/$id', authenticated: true);
      final decoded = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200 && decoded['success'] == true) {
        myEvents.removeWhere((e) => e.id == id);
        isLoading = false;
        notifyListeners();
        return true;
      } else {
        errorMessage = decoded['message'] as String? ?? 'Lỗi xóa sự kiện';
      }
    } catch (e) {
      errorMessage = 'Không thể xóa sự kiện. Vui lòng thử lại.';
    }

    isLoading = false;
    notifyListeners();
    return false;
  }

  // ─── Participants (registrations) ──────────────────────────────────────────

  Future<void> fetchParticipants(int eventId) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.get('/api/events/$eventId/registrations', authenticated: true);
      final decoded = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200 && decoded['success'] == true) {
        final data = decoded['data'] as List<dynamic>? ?? [];
        participants = data.map((e) => Participant.fromJson(e as Map<String, dynamic>)).toList();
      } else {
        errorMessage = decoded['message'] as String? ?? 'Lỗi tải danh sách';
      }
    } catch (e) {
      errorMessage = 'Không thể tải danh sách. Vui lòng thử lại.';
    }

    isLoading = false;
    notifyListeners();
  }

  // ─── Attendance (check-in records) ────────────────────────────────────────

  Future<void> fetchAttendanceForEvent(int eventId) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.get(
        '/api/attendance?event_id=$eventId',
        authenticated: true,
      );
      final decoded = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200) {
        // API may return data directly or wrapped
        final rawData = decoded['data'] ?? decoded;
        final List<dynamic> data = rawData is List ? rawData : [];
        attendance = data.map((e) {
          final m = e as Map<String, dynamic>;
          return Participant(
            id: (m['user_id'] ?? m['id'] ?? 0) as int,
            fullName: (m['student_name'] ?? m['full_name'] ?? m['name'] ?? '') as String,
            email: (m['email'] ?? '') as String,
            studentCode: m['student_code'] as String?,
            status: (m['registration_status'] == 'attended' || m['status'] == 'checked_in')
                ? 'checked_in'
                : 'registered',
            checkInTime: m['check_in_time'] != null
                ? DateTime.tryParse(m['check_in_time'] as String)
                : null,
          );
        }).toList();
      } else {
        errorMessage = decoded['message'] as String? ?? 'Lỗi tải điểm danh';
      }
    } catch (e) {
      errorMessage = 'Không thể tải điểm danh. Vui lòng thử lại.';
    }

    isLoading = false;
    notifyListeners();
  }

  // ─── QR Scan Check-in ─────────────────────────────────────────────────────

  Future<Map<String, dynamic>?> scanQr(String qrToken) async {
    try {
      final response = await _api.post(
        '/api/attendance/scan-qr',
        body: {'qr_token': qrToken},
        authenticated: true,
      );
      final decoded = jsonDecode(response.body) as Map<String, dynamic>;
      return decoded;
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  // ─── Manual Check-in ──────────────────────────────────────────────────────

  Future<bool> manualCheckIn(int eventId, String studentCode) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.post(
        '/api/attendance/manual-checkin',
        body: {'event_id': eventId, 'student_code': studentCode},
        authenticated: true,
      );
      final decoded = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200 && decoded['success'] == true) {
        final alreadyCheckedIn = decoded['data']?['already_checked_in'] == true;
        if (alreadyCheckedIn) {
          errorMessage = 'Sinh viên này đã điểm danh trước đó';
          isLoading = false;
          notifyListeners();
          return false;
        }
        // Refresh attendance list
        await fetchAttendanceForEvent(eventId);
        return true;
      } else {
        errorMessage = decoded['message'] as String? ?? 'Lỗi điểm danh thủ công';
      }
    } catch (e) {
      errorMessage = 'Không thể điểm danh thủ công. Vui lòng thử lại.';
    }

    isLoading = false;
    notifyListeners();
    return false;
  }

  // ─── Dashboard Summary ────────────────────────────────────────────────────

  int get totalEvents => myEvents.length;

  int get upcomingEvents =>
      myEvents.where((e) => e.startTime.isAfter(DateTime.now())).length;

  int get totalRegistered =>
      myEvents.fold(0, (sum, e) => sum + (e.registeredCount ?? 0));

  int get totalCheckedIn =>
      myEvents.fold(0, (sum, e) => sum + (e.checkedInCount ?? 0));

  // ─── Attendance helpers ───────────────────────────────────────────────────

  int get attendanceCheckedIn => attendance.where((p) => p.isCheckedIn).length;
}
