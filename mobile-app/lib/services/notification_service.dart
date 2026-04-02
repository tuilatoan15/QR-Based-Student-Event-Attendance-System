import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../config/api_config.dart';
import '../models/event.dart';
import '../models/notification.dart';

class NotificationService extends ChangeNotifier {
  NotificationService();

  static const _notifyUpcomingEventsKey = 'notify_upcoming_events';
  static const _notifyAttendanceUpdatesKey = 'notify_attendance_updates';
  static const _lastLocalCheckinNotificationIdKey =
      'last_local_checkin_notification_id';
  static const _sentUpcomingReminderKeys = 'sent_upcoming_event_reminders';

  final String baseUrl = ApiConfig.baseUrl;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  List<AppNotification> _notifications = [];
  bool _isLoading = false;
  bool _initialized = false;
  bool _notifyUpcomingEvents = true;
  bool _notifyAttendanceUpdates = true;
  Timer? _pollTimer;

  List<AppNotification> get notifications => _notifications;
  bool get isLoading => _isLoading;
  int get unreadCount => _notifications.where((n) => !n.isRead).length;
  bool get notifyUpcomingEvents => _notifyUpcomingEvents;
  bool get notifyAttendanceUpdates => _notifyAttendanceUpdates;

  Future<void> initialize() async {
    if (_initialized) return;
    _initialized = true;

    await _loadSettings();
    await _initializeLocalNotifications();
    await refreshBackgroundSignals(primeExisting: true);

    _pollTimer = Timer.periodic(
      const Duration(minutes: 1),
      (_) => refreshBackgroundSignals(),
    );
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    _notifyUpcomingEvents = prefs.getBool(_notifyUpcomingEventsKey) ?? true;
    _notifyAttendanceUpdates =
        prefs.getBool(_notifyAttendanceUpdatesKey) ?? true;
  }

  Future<void> _initializeLocalNotifications() async {
    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const settings = InitializationSettings(android: androidSettings);

    await _localNotifications.initialize(settings);
    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.requestNotificationsPermission();
  }

  Future<void> setNotifyUpcomingEvents(bool value) async {
    _notifyUpcomingEvents = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_notifyUpcomingEventsKey, value);
    notifyListeners();
  }

  Future<void> setNotifyAttendanceUpdates(bool value) async {
    _notifyAttendanceUpdates = value;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_notifyAttendanceUpdatesKey, value);
    notifyListeners();
  }

  Future<void> refreshBackgroundSignals({bool primeExisting = false}) async {
    await fetchNotifications(
      showLocalAlerts: !primeExisting,
      primeExisting: primeExisting,
    );
    await _checkUpcomingEventReminders();
  }

  Future<void> fetchNotifications({
    bool showLocalAlerts = false,
    bool primeExisting = false,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      final token = await _readToken();
      if (token == null) {
        _notifications = [];
        return;
      }

      final response = await http.get(
        Uri.parse('$baseUrl/api/users/me/notifications'),
        headers: {
          'Authorization': 'Bearer $token',
          'x-client': 'mobile-app',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body) as Map<String, dynamic>;
        final notifList = (data['data'] as List<dynamic>? ?? [])
            .map((json) => AppNotification.fromJson(json))
            .toList();
        _notifications = notifList;

        if (showLocalAlerts || primeExisting) {
          await _handleAttendanceLocalNotifications(
            notifList,
            primeExisting: primeExisting,
          );
        }
      }
    } catch (e) {
      debugPrint('Error fetching notifications: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> _handleAttendanceLocalNotifications(
    List<AppNotification> notifList, {
    required bool primeExisting,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final maxId = notifList.length; // Dùng độ dài danh sách để đơn giản hóa maxId
    final lastDeliveredCount =
        prefs.getInt(_lastLocalCheckinNotificationIdKey) ?? 0;

    if (primeExisting) {
      await prefs.setInt(_lastLocalCheckinNotificationIdKey, notifList.length);
      return;
    }

    if (!_notifyAttendanceUpdates) {
      if (notifList.length > lastDeliveredCount) {
        await prefs.setInt(_lastLocalCheckinNotificationIdKey, notifList.length);
      }
      return;
    }

    // Lấy các thông báo quan trọng mới nhất chưa hiển thị
    final importantTypes = ['checkin', 'registration', 'cancellation'];
    final newSignals = notifList
        .where((n) => importantTypes.contains(n.type))
        .toList()
        .reversed
        .toList();
    
    if (newSignals.length > lastDeliveredCount) {
      for (int i = lastDeliveredCount; i < newSignals.length; i++) {
        final notification = newSignals[i];
        await _showLocalNotification(
          id: notification.id.hashCode,
          title: notification.title.isNotEmpty ? notification.title : 'Thông báo mới',
          body: notification.message,
        );
      }
      await prefs.setInt(_lastLocalCheckinNotificationIdKey, newSignals.length);
    }
  }

  Future<void> _checkUpcomingEventReminders() async {
    if (!_notifyUpcomingEvents) return;

    final token = await _readToken();
    if (token == null) return;

    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/users/me/events'),
        headers: {
          'Authorization': 'Bearer $token',
          'x-client': 'mobile-app',
        },
      );

      if (response.statusCode != 200) return;

      final data = json.decode(response.body) as Map<String, dynamic>;
      final events = (data['data'] as List<dynamic>? ?? [])
          .map((json) => Event.fromJson(json as Map<String, dynamic>))
          .toList();

      final prefs = await SharedPreferences.getInstance();
      final sentKeys =
          prefs.getStringList(_sentUpcomingReminderKeys)?.toSet() ?? <String>{};
      final now = DateTime.now();
      var updated = false;

      for (final event in events) {
        final start = event.startTime.toLocal();
        if (start.isBefore(now)) continue;

        final minutesLeft = start.difference(now).inMinutes;
        String? key;
        String? title;
        String? body;

        if (minutesLeft <= 60) {
          key = 'event_${event.id}_1h';
          title = 'Sự kiện sắp bắt đầu';
          body = 'Sự kiện "${event.title}" sẽ bắt đầu trong khoảng 1 giờ nữa.';
        } else if (minutesLeft <= 24 * 60) {
          key = 'event_${event.id}_24h';
          title = 'Nhắc lịch sự kiện';
          body = 'Sự kiện "${event.title}" sẽ diễn ra trong vòng 24 giờ tới.';
        }

        if (key != null && !sentKeys.contains(key)) {
          // Sử dụng hashCode để tạo ID thông báo duy nhất từ String ID
          await _showLocalNotification(
            id: event.id.hashCode + (minutesLeft <= 60 ? 1 : 2),
            title: title!,
            body: body!,
          );
          sentKeys.add(key);
          updated = true;
        }
      }

      if (updated) {
        await prefs.setStringList(
          _sentUpcomingReminderKeys,
          sentKeys.toList(),
        );
      }
    } catch (e) {
      debugPrint('Error checking upcoming events: $e');
    }
  }

  Future<void> _showLocalNotification({
    required int id,
    required String title,
    required String body,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'attendance_channel',
      'Attendance Notifications',
      channelDescription: 'Thong bao diem danh va su kien sap dien ra',
      importance: Importance.max,
      priority: Priority.high,
    );

    const details = NotificationDetails(android: androidDetails);
    await _localNotifications.show(id, title, body, details);
  }

  Future<void> markAsRead(String notificationId) async {
    try {
      final token = await _readToken();
      if (token == null) return;

      final response = await http.patch(
        Uri.parse('$baseUrl/api/users/me/notifications/$notificationId/read'),
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
            type: old.type,
            eventId: old.eventId,
          );
          notifyListeners();
        }
      }
    } catch (e) {
      debugPrint('Error marking notification as read: $e');
    }
  }

  Future<void> markAllAsRead() async {
    try {
      final token = await _readToken();
      if (token == null) return;

      final response = await http.patch(
        Uri.parse('$baseUrl/api/users/me/notifications/read-all'),
        headers: {
          'Authorization': 'Bearer $token',
          'x-client': 'mobile-app',
        },
      );

      if (response.statusCode == 200) {
        _notifications = _notifications
            .map(
              (n) => AppNotification(
                id: n.id,
                title: n.title,
                message: n.message,
                isRead: true,
                createdAt: n.createdAt,
                type: n.type,
                eventId: n.eventId,
              ),
            )
            .toList();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error marking all notifications as read: $e');
    }
  }

  Future<String?> _readToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  void clearData() {
    _notifications = [];
    _isLoading = false;
    notifyListeners();
  }
}
