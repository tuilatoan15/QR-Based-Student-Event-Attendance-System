import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config/api_config.dart';
import '../models/user.dart';
import 'api_service.dart';

class AuthService extends ChangeNotifier {
  AuthService() : _api = ApiService(ApiConfig.baseUrl);

  final ApiService _api;

  User? currentUser;
  String? _token;
  bool isLoading = false;
  String? errorMessage;

  bool get isAuthenticated => _token != null && _token!.isNotEmpty;

  Future<void> loadToken() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('auth_token');

    // Also load user data
    final userJson = prefs.getString('user_data');
    if (userJson != null) {
      try {
        final userData = jsonDecode(userJson) as Map<String, dynamic>;
        final loadedUser = User.fromJson(userData);
        final role = loadedUser.role.toLowerCase();
        // Only keep session for student users
        if (role == 'student' || role == '3') {
          currentUser = loadedUser;
        } else {
          await prefs.remove('auth_token');
          await prefs.remove('user_data');
          _token = null;
          currentUser = null;
        }
      } catch (e) {
        await prefs.remove('auth_token');
        await prefs.remove('user_data');
        currentUser = null;
        _token = null;
      }
    } else {
      // Fix infinite spinner: if no user data, invalid session
      if (_token != null) {
        await prefs.remove('auth_token');
        _token = null;
      }
    }

    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.post('/api/auth/login', body: {
        'email': email,
        'password': password,
      });

      final decoded = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200 && decoded['success'] == true) {
        final data = decoded['data'] as Map<String, dynamic>;
        final userJson = data['user'] as Map<String, dynamic>;
        final user = User.fromJson(userJson);
        final role = user.role.toLowerCase();

        if (role != 'student' && role != '3') {
          // Block non-student roles on mobile app
          errorMessage =
              'Only students are allowed to use the mobile application.';
          // Ensure no token/session is stored
          currentUser = null;
          _token = null;
        } else {
          _token = data['token'] as String?;
          currentUser = user;

          final prefs = await SharedPreferences.getInstance();
          await prefs.setString('auth_token', _token ?? '');
          await prefs.setString('user_data', jsonEncode(userJson));

          isLoading = false;
          notifyListeners();
          return true;
        }
      } else {
        errorMessage = decoded['message'] as String? ?? 'Login failed';
      }
    } catch (e) {
      errorMessage = 'Unable to login. Please try again.';
    }

    isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> register({
    required String fullName,
    required String email,
    required String password,
    String? studentCode,
  }) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.post('/api/auth/register', body: {
        'full_name': fullName,
        'email': email,
        'password': password,
        if (studentCode != null && studentCode.isNotEmpty)
          'student_code': studentCode,
      });

      final decoded = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 201 && decoded['success'] == true) {
        // Auto-login: same response structure as login
        final data = decoded['data'] as Map<String, dynamic>;
        _token = data['token'] as String?;
        currentUser = User.fromJson(data['user'] as Map<String, dynamic>);

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', _token ?? '');
        await prefs.setString(
            'user_data', jsonEncode(data['user'])); // Save user data

        isLoading = false;
        notifyListeners();
        return true;
      } else {
        errorMessage = decoded['message'] as String? ?? 'Registration failed';
      }
    } catch (e) {
      errorMessage = 'Unable to register. Please try again.';
    }

    isLoading = false;
    notifyListeners();
    return false;
  }

  Future<void> logout() async {
    currentUser = null;
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_data'); // Clear user data
    notifyListeners();
  }

  Future<bool> updateAvatar(String filePath) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.postMultipart(
        '/api/users/me/avatar',
        filePath: filePath,
        fieldName: 'avatar',
      );

      final decoded = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200 && decoded['success'] == true) {
        final newAvatar = decoded['data']['avatar'] as String;

        // Update current user locally
        if (currentUser != null) {
          final updatedUser = User(
            id: currentUser!.id,
            fullName: currentUser!.fullName,
            email: currentUser!.email,
            role: currentUser!.role,
            studentCode: currentUser!.studentCode,
            avatar: newAvatar,
          );

          currentUser = updatedUser;

          // Save updated user to preferences
          final prefs = await SharedPreferences.getInstance();
          final userMap = {
            'id': updatedUser.id,
            'full_name': updatedUser.fullName,
            'email': updatedUser.email,
            'role': updatedUser.role,
            'student_code': updatedUser.studentCode,
            'avatar': updatedUser.avatar,
          };
          await prefs.setString('user_data', jsonEncode(userMap));
        }

        isLoading = false;
        notifyListeners();
        return true;
      } else {
        errorMessage = decoded['message'] as String? ?? 'Update avatar failed';
      }
    } catch (e) {
      errorMessage = 'Error uploading avatar. Please try again.';
    }

    isLoading = false;
    notifyListeners();
    return false;
  }
}
