import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiService {
  ApiService(this.baseUrl);

  final String baseUrl;

  /// Protected endpoints that always require authentication
  static const Set<String> _protectedEndpoints = {
    '/api/events/register',
    '/api/users/me/events',
    '/api/attendance/checkin',
  };

  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  /// Check if endpoint requires authentication
  bool _isProtectedEndpoint(String path) {
    for (final endpoint in _protectedEndpoints) {
      if (path.contains(endpoint)) {
        return true;
      }
    }
    return false;
  }

  Future<http.Response> post(
    String path, {
    Map<String, dynamic>? body,
    bool? authenticated,
  }) async {
    final uri = Uri.parse('$baseUrl$path');
    final headers = <String, String>{'Content-Type': 'application/json'};

    // Auto-detect if path requires auth, or use explicit flag
    final needsAuth = authenticated ?? _isProtectedEndpoint(path);

    if (needsAuth) {
      final token = await _getToken();
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    return http.post(uri, headers: headers, body: jsonEncode(body ?? {}));
  }

  Future<http.Response> get(
    String path, {
    bool? authenticated,
  }) async {
    final uri = Uri.parse('$baseUrl$path');
    final headers = <String, String>{'Content-Type': 'application/json'};

    // Auto-detect if path requires auth, or use explicit flag
    final needsAuth = authenticated ?? _isProtectedEndpoint(path);

    if (needsAuth) {
      final token = await _getToken();
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    return http.get(uri, headers: headers);
  }

  Future<http.Response> delete(
    String path, {
    bool? authenticated,
  }) async {
    final uri = Uri.parse('$baseUrl$path');
    final headers = <String, String>{'Content-Type': 'application/json'};

    // Auto-detect if path requires auth, or use explicit flag
    final needsAuth = authenticated ?? _isProtectedEndpoint(path);

    if (needsAuth) {
      final token = await _getToken();
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    return http.delete(uri, headers: headers);
  }
}
