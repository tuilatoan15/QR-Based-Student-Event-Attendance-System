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
        _token = data['token'] as String?;
        currentUser = User.fromJson(data['user'] as Map<String, dynamic>);

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', _token ?? '');

        isLoading = false;
        notifyListeners();
        return true;
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
        if (studentCode != null && studentCode.isNotEmpty) 'student_code': studentCode,
      });

      final decoded = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 201 && decoded['success'] == true) {
        // Auto-login: same response structure as login
        final data = decoded['data'] as Map<String, dynamic>;
        _token = data['token'] as String?;
        currentUser = User.fromJson(data['user'] as Map<String, dynamic>);

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', _token ?? '');

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
    notifyListeners();
  }
}

