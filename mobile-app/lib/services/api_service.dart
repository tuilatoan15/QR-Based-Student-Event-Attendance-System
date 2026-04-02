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
    if (path.contains('/api/auth/')) return false;
    return path.contains('/api/');
  }

  Future<http.Response> post(
    String path, {
    Map<String, dynamic>? body,
    bool? authenticated,
  }) async {
    final uri = Uri.parse('$baseUrl$path');
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'X-Client': 'mobile-app',
    };

    // Auto-detect if path requires auth, or use explicit flag
    final needsAuth = authenticated ?? _isProtectedEndpoint(path);

    if (needsAuth) {
      final token = await _getToken();
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    return http
        .post(uri, headers: headers, body: jsonEncode(body ?? {}))
        .timeout(const Duration(seconds: 20));
  }

  Future<http.Response> put(
    String path, {
    Map<String, dynamic>? body,
    bool? authenticated,
  }) async {
    final uri = Uri.parse('$baseUrl$path');
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'X-Client': 'mobile-app',
    };

    // Auto-detect if path requires auth, or use explicit flag
    final needsAuth = authenticated ?? _isProtectedEndpoint(path);

    if (needsAuth) {
      final token = await _getToken();
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    return http
        .put(uri, headers: headers, body: jsonEncode(body ?? {}))
        .timeout(const Duration(seconds: 20));
  }

  Future<http.Response> patch(
    String path, {
    Map<String, dynamic>? body,
    bool? authenticated,
  }) async {
    final uri = Uri.parse('$baseUrl$path');
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'X-Client': 'mobile-app',
    };

    final needsAuth = authenticated ?? _isProtectedEndpoint(path);

    if (needsAuth) {
      final token = await _getToken();
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    return http
        .patch(uri, headers: headers, body: jsonEncode(body ?? {}))
        .timeout(const Duration(seconds: 20));
  }

  Future<http.Response> get(
    String path, {
    bool? authenticated,
  }) async {
    final uri = Uri.parse('$baseUrl$path');
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'X-Client': 'mobile-app',
    };

    // Auto-detect if path requires auth, or use explicit flag
    final needsAuth = authenticated ?? _isProtectedEndpoint(path);

    if (needsAuth) {
      final token = await _getToken();
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    return http.get(uri, headers: headers).timeout(const Duration(seconds: 20));
  }

  Future<http.Response> delete(
    String path, {
    bool? authenticated,
  }) async {
    final uri = Uri.parse('$baseUrl$path');
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'X-Client': 'mobile-app',
    };

    // Auto-detect if path requires auth, or use explicit flag
    final needsAuth = authenticated ?? _isProtectedEndpoint(path);

    if (needsAuth) {
      final token = await _getToken();
      if (token != null && token.isNotEmpty) {
        headers['Authorization'] = 'Bearer $token';
      }
    }

    return http
        .delete(uri, headers: headers)
        .timeout(const Duration(seconds: 20));
  }

  Future<http.Response> postMultipart(
    String path, {
    required String filePath,
    required String fieldName,
    bool? authenticated,
  }) async {
    final uri = Uri.parse('$baseUrl$path');
    final request = http.MultipartRequest('POST', uri);

    final needsAuth = authenticated ?? _isProtectedEndpoint(path);
    if (needsAuth) {
      final token = await _getToken();
      if (token != null && token.isNotEmpty) {
        request.headers['Authorization'] = 'Bearer $token';
      }
    }

    request.headers['X-Client'] = 'mobile-app';
    request.files.add(await http.MultipartFile.fromPath(fieldName, filePath));

    final streamedResponse = await request.send();
    return http.Response.fromStream(streamedResponse);
  }

  Future<http.Response> sendMultipart(
    String method,
    String path, {
    Map<String, String>? fields,
    List<http.MultipartFile>? files,
    bool? authenticated,
  }) async {
    final uri = Uri.parse('$baseUrl$path');
    final request = http.MultipartRequest(method.toUpperCase(), uri);

    final needsAuth = authenticated ?? _isProtectedEndpoint(path);
    if (needsAuth) {
      final token = await _getToken();
      if (token != null && token.isNotEmpty) {
        request.headers['Authorization'] = 'Bearer $token';
      }
    }

    request.headers['X-Client'] = 'mobile-app';

    if (fields != null) {
      request.fields.addAll(fields);
    }

    if (files != null) {
      request.files.addAll(files);
    }

    final streamedResponse = await request.send();
    return http.Response.fromStream(streamedResponse);
  }
}
