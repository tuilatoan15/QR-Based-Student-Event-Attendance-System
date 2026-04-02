import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/api_config.dart';

class ReportService extends ChangeNotifier {
  final String baseUrl = ApiConfig.baseUrl;

  Future<bool> submitReport({
    required String type,
    required String title,
    required String content,
  }) async {
    try {
      final token = await _readToken();
      if (token == null) return false;

      final response = await http.post(
        Uri.parse('$baseUrl/api/reports'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
          'x-client': 'mobile-app',
        },
        body: json.encode({
          'type': type,
          'title': title,
          'content': content,
        }),
      );

      return response.statusCode == 201;
    } catch (e) {
      debugPrint('Error submitting report: $e');
      return false;
    }
  }

  Future<List<dynamic>> getMyReports() async {
    try {
      final token = await _readToken();
      if (token == null) return [];

      final response = await http.get(
        Uri.parse('$baseUrl/api/reports/me'),
        headers: {
          'Authorization': 'Bearer $token',
          'x-client': 'mobile-app',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['data'] as List<dynamic>;
      }
      return [];
    } catch (e) {
      debugPrint('Error fetching reports: $e');
      return [];
    }
  }

  Future<String?> _readToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }
}
