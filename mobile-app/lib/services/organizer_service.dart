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

  // ─── Participants ──────────────────────────────────────────────────────────

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

  // ─── Dashboard Summary ────────────────────────────────────────────────────

  int get totalEvents => myEvents.length;

  int get upcomingEvents =>
      myEvents.where((e) => e.startTime.isAfter(DateTime.now())).length;

  int get totalRegistered =>
      myEvents.fold(0, (sum, e) => sum + (e.registeredCount ?? 0));
}
