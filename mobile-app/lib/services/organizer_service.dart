import 'dart:convert';
import 'dart:io';

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

  Future<String> _encodeImageFile(String path) async {
    final extension = path.split('.').last.toLowerCase();
    final mimeType = extension == 'png'
        ? 'image/png'
        : extension == 'webp'
            ? 'image/webp'
            : 'image/jpeg';
    final bytes = await File(path).readAsBytes();
    return 'data:$mimeType;base64,${base64Encode(bytes)}';
  }

  // ─── Organizer Events ───────────────────────────────────────────────────────

  Future<void> fetchMyEvents() async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.get('/api/events/organizer/events?limit=100', authenticated: true);
      final decoded = jsonDecode(response.body);

      if (response.statusCode == 200 && decoded is Map && decoded['success'] == true) {
        final data = decoded['data'] as List<dynamic>? ?? [];
        myEvents = data.map((e) => Event.fromJson(e as Map<String, dynamic>)).toList();
      } else {
        errorMessage = decoded is Map ? decoded['message'] : 'Lỗi tải sự kiện';
      }
    } catch (e) {
      errorMessage = 'Không thể tải sự kiện. Lỗi: $e';
    }

    isLoading = false;
    notifyListeners();
  }

  Future<bool> createEvent(Map<String, String> fields, List<String> filePaths) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final encodedImages = await Future.wait(filePaths.map(_encodeImageFile));
      final response = await _api.post(
        '/api/events',
        body: {
          ...fields,
          'images': encodedImages,
        },
        authenticated: true,
      );
      final decoded = jsonDecode(response.body);

      if ((response.statusCode == 200 || response.statusCode == 201) && decoded is Map && decoded['success'] == true) {
        await fetchMyEvents();
        return true;
      } else {
        errorMessage = decoded is Map ? decoded['message'] : 'Lỗi tạo sự kiện';
      }
    } catch (e) {
      errorMessage = 'Không thể tạo sự kiện. Lỗi: $e';
    }

    isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> updateEvent(dynamic id, Map<String, String> fields, List<String> filePaths, List<String> existingImages) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final newImages = await Future.wait(filePaths.map(_encodeImageFile));
      final response = await _api.put(
        '/api/events/$id',
        body: {
          ...fields,
          'images': [...existingImages, ...newImages],
        },
        authenticated: true,
      );
      final decoded = jsonDecode(response.body);

      if (response.statusCode == 200 && decoded is Map && decoded['success'] == true) {
        await fetchMyEvents();
        return true;
      } else {
        errorMessage = decoded is Map ? decoded['message'] : 'Lỗi cập nhật sự kiện';
      }
    } catch (e) {
      errorMessage = 'Không thể cập nhật sự kiện. Lỗi: $e';
    }

    isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> deleteEvent(dynamic id) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.delete('/api/events/$id', authenticated: true);
      final decoded = jsonDecode(response.body);

      if (response.statusCode == 200 && decoded is Map && decoded['success'] == true) {
        myEvents.removeWhere((e) => e.id.toString() == id.toString());
        isLoading = false;
        notifyListeners();
        return true;
      } else {
        errorMessage = decoded is Map ? decoded['message'] : 'Lỗi xóa sự kiện';
      }
    } catch (e) {
      errorMessage = 'Không thể xóa sự kiện. Lỗi: $e';
    }

    isLoading = false;
    notifyListeners();
    return false;
  }

  // ─── Participants (registrations) ──────────────────────────────────────────

  Future<void> fetchParticipants(dynamic eventId) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.get('/api/events/$eventId/registrations', authenticated: true);
      final decoded = jsonDecode(response.body);

      if (response.statusCode == 200 && decoded is Map && decoded['success'] == true) {
        final data = decoded['data'] as List<dynamic>? ?? [];
        participants = data.map((e) => Participant.fromJson(e as Map<String, dynamic>)).toList();
      } else {
        errorMessage = decoded is Map ? decoded['message'] : 'Lỗi tải danh sách';
      }
    } catch (e) {
      errorMessage = 'Không thể tải danh sách. Lỗi: $e';
    }

    isLoading = false;
    notifyListeners();
  }

  // ─── Attendance (check-in records) ────────────────────────────────────────

  Future<void> fetchAttendanceForEvent(dynamic eventId) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.get(
        '/api/attendance?event_id=$eventId',
        authenticated: true,
      );
      final decoded = jsonDecode(response.body);

      if (response.statusCode == 200 && decoded is Map) {
        final rawData = decoded['data'] ?? decoded;
        final List<dynamic> data = rawData is List ? rawData : [];
        attendance = data.map((e) {
          final m = e as Map<String, dynamic>;
          return Participant(
            id: m['user_id']?.toString() ?? m['id']?.toString() ?? '',
            fullName: (m['student_name'] ?? m['full_name'] ?? m['name'] ?? '') as String,
            email: (m['email'] ?? '') as String,
            studentCode: m['student_code']?.toString(),
            status: m['registration_status'] == 'cancelled'
                ? 'cancelled'
                : (m['registration_status'] == 'attended' || m['status'] == 'checked_in')
                    ? 'checked_in'
                    : 'registered',
            checkInTime: m['check_in_time'] != null
                ? DateTime.tryParse(m['check_in_time'].toString().endsWith('Z') ? m['check_in_time'] : '${m['check_in_time']}Z')?.toLocal()
                : null,
          );
        }).toList();
      } else {
        errorMessage = decoded is Map ? decoded['message'] : 'Lỗi tải điểm danh';
      }
    } catch (e) {
      errorMessage = 'Không thể tải điểm danh. Lỗi: $e';
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
      final decoded = jsonDecode(response.body);
      return decoded is Map<String, dynamic> ? decoded : {'success': false, 'message': 'Dữ liệu không hợp lệ'};
    } catch (e) {
      return {'success': false, 'message': 'Lỗi kết nối: $e'};
    }
  }

  // ─── Manual Check-in ──────────────────────────────────────────────────────

  Future<bool> manualCheckIn(dynamic eventId, String studentCode) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.post(
        '/api/attendance/manual-checkin',
        body: {'event_id': eventId, 'student_code': studentCode},
        authenticated: true,
      );
      final decoded = jsonDecode(response.body);

      if (response.statusCode == 200 && decoded is Map && decoded['success'] == true) {
        final alreadyCheckedIn = decoded['data']?['already_checked_in'] == true;
        if (alreadyCheckedIn) {
          errorMessage = 'Sinh viên này đã điểm danh trước đó';
          isLoading = false;
          notifyListeners();
          return false;
        }
        await fetchAttendanceForEvent(eventId);
        return true;
      } else {
        errorMessage = decoded is Map ? decoded['message'] : 'Lỗi điểm danh thủ công';
      }
    } catch (e) {
      errorMessage = 'Không thể điểm danh thủ công. Lỗi: $e';
    }

    isLoading = false;
    notifyListeners();
    return false;
  }

  // ─── Dashboard Summary ────────────────────────────────────────────────────

  int get totalEvents => myEvents.length;
  int get upcomingEvents => myEvents.where((e) => e.startTime.isAfter(DateTime.now())).length;
  int get totalRegistered => myEvents.fold(0, (sum, e) => sum + (e.registeredCount ?? 0));
  int get totalCheckedIn => myEvents.fold(0, (sum, e) => sum + (e.checkedInCount ?? 0));

  void clearData() {
    myEvents = [];
    participants = [];
    attendance = [];
    isLoading = false;
    errorMessage = null;
    notifyListeners();
  }
}
