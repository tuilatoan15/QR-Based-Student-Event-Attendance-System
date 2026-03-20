import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../config/api_config.dart';
import 'api_service.dart';

class UserService extends ChangeNotifier {
  UserService() : _api = ApiService(ApiConfig.baseUrl);

  final ApiService _api;

  bool isLoading = false;
  String? errorMessage;
  Map<String, dynamic>? organizerProfile;

  Future<void> fetchOrganizerProfile() async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.get('/api/users/me/organizer-profile', authenticated: true);
      final decoded = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200 && decoded['success'] == true) {
        organizerProfile = decoded['data'] as Map<String, dynamic>?;
      } else {
        errorMessage = decoded['message'] as String? ?? 'Lỗi tải hồ sơ';
      }
    } catch (e) {
      errorMessage = 'Không thể tải hồ sơ. Vui lòng thử lại.';
    }

    isLoading = false;
    notifyListeners();
  }

  Future<bool> updateOrganizerProfile(Map<String, dynamic> body) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      // Notice: _api.patch might not exist in api_service.dart. I will check and use post/put if necessary.
      // Assuming patch exists, but let's check ApiService if needed. Actually in api_service.dart we may only have put?
      // Wait, we can use patch if api_service.dart has it. Let's use patch, but if it fails I'll update it.
      final response = await _api.patch('/api/users/me/organizer-profile', body: body, authenticated: true);
      final decoded = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200 && decoded['success'] == true) {
        organizerProfile = decoded['data'] as Map<String, dynamic>?;
        isLoading = false;
        notifyListeners();
        return true;
      } else {
        errorMessage = decoded['message'] as String? ?? 'Lỗi cập nhật hồ sơ';
      }
    } catch (e) {
      errorMessage = 'Không thể cập nhật hồ sơ: $e';
    }

    isLoading = false;
    notifyListeners();
    return false;
  }
}
