import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/notification.dart';

class NotificationService extends ChangeNotifier {
  final String baseUrl = 'http://10.0.2.2:5000/api'; // Use 10.0.2.2 for Android emulator
  List<AppNotification> _notifications = [];
  bool _isLoading = false;

  List<AppNotification> get notifications => _notifications;
  bool get isLoading => _isLoading;
  int get unreadCount => _notifications.where((n) => !n.isRead).length;

  Future<void> fetchNotifications() async {
    _isLoading = true;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      if (token == null) return;

      final response = await http.get(
        Uri.parse('$baseUrl/users/me/notifications'),
        headers: {
          'Authorization': 'Bearer $token',
          'x-client': 'mobile-app',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> notifList = data['data'] ?? [];
        _notifications = notifList.map((json) => AppNotification.fromJson(json)).toList();
      }
    } catch (e) {
      print('Error fetching notifications: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> markAsRead(int notificationId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      if (token == null) return;

      final response = await http.patch(
        Uri.parse('$baseUrl/users/me/notifications/$notificationId/read'),
        headers: {
          'Authorization': 'Bearer $token',
          'x-client': 'mobile-app',
        },
      );

      if (response.statusCode == 200) {
        final index = _notifications.indexWhere((n) => n.id == notificationId);
        if (index != -1) {
          final old = _notifications[index];
          _notifications[index] = AppNotification(
            id: old.id,
            title: old.title,
            message: old.message,
            isRead: true,
            createdAt: old.createdAt,
          );
          notifyListeners();
        }
      }
    } catch (e) {
      print('Error marking notification as read: $e');
    }
  }
}
