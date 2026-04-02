import 'dart:async';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:device_info_plus/device_info_plus.dart';

/// ApiConfig cung cấp base URL và các endpoint helper.
///
/// Sử dụng:
/// ```dart
/// await ApiConfig.init(lanIp: '10.143.222.37');
/// final url = ApiConfig.loginUrl();
/// ```
class ApiConfig {
  // Cho phép override khi build: --dart-define=API_BASE_URL=https://...
  static const String _compileTimeOverride =
      String.fromEnvironment('API_BASE_URL', defaultValue: '');

  // Có thể đặt LAN IP khi init (thường IP máy dev trên cùng Wi‑Fi):
  static String _lanIp = '10.143.222.37';

  // Thời gian probe ngắn để kiểm tra host (ms)
  static Duration _probeTimeout = const Duration(milliseconds: 1200);

  static String? _cachedBaseUrl;

  /// Khởi tạo và phát hiện baseUrl phù hợp. Gọi một lần trước `runApp()`.
  static Future<void> init({String? lanIp, Duration? probeTimeout}) async {
    if (lanIp != null && lanIp.isNotEmpty) _lanIp = lanIp;
    if (probeTimeout != null) _probeTimeout = probeTimeout;

    if (_compileTimeOverride.isNotEmpty) {
      _cachedBaseUrl = _compileTimeOverride;
      return;
    }

    if (kIsWeb) {
      _cachedBaseUrl = 'http://localhost:5000';
      return;
    }

    try {
      if (Platform.isAndroid) {
        final deviceInfo = DeviceInfoPlugin();
        final androidInfo = await deviceInfo.androidInfo;
        final isPhysical = androidInfo.isPhysicalDevice ?? true;

        if (!isPhysical) {
          // Android emulator -> forward to host localhost
          _cachedBaseUrl = 'http://10.0.2.2:5000';
          return;
        }

        // Physical Android device: check if adb reverse is active (127.0.0.1)
        if (await _hostResponds('127.0.0.1')) {
          _cachedBaseUrl = 'http://127.0.0.1:5000';
          return;
        }

        // Try LAN IP
        if (await _hostResponds(_lanIp)) {
          _cachedBaseUrl = 'http://$_lanIp:5000';
          return;
        }

        // Fallback to LAN IP (best effort)
        _cachedBaseUrl = 'http://$_lanIp:5000';
        return;
      }

      if (Platform.isIOS) {
        final deviceInfo = DeviceInfoPlugin();
        final iosInfo = await deviceInfo.iosInfo;
        final isPhysical = iosInfo.isPhysicalDevice ?? true;

        if (!isPhysical) {
          // iOS simulator uses host localhost
          _cachedBaseUrl = 'http://localhost:5000';
          return;
        }

        if (await _hostResponds(_lanIp)) {
          _cachedBaseUrl = 'http://$_lanIp:5000';
          return;
        }

        _cachedBaseUrl = 'http://$_lanIp:5000';
        return;
      }
    } catch (e) {
      // Nếu việc phát hiện lỗi, bỏ qua và dùng fallback
    }

    // Mặc định (fallback)
    _cachedBaseUrl = 'http://127.0.0.1:5000';
  }

  static Future<bool> _hostResponds(String host) async {
    final uri = Uri.parse('http://$host:5000/health');
    try {
      final client = HttpClient();
      // Thử GET /health nhanh
      final request = await client.getUrl(uri).timeout(_probeTimeout);
      final response = await request.close().timeout(_probeTimeout);
      client.close(force: true);
      return response.statusCode >= 200 && response.statusCode < 500;
    } catch (_) {
      return false;
    }
  }

  /// Sử dụng giá trị đã cache nếu đã init, nếu chưa init trả về compile-time override hoặc fallback
  static String get baseUrl {
    if (_cachedBaseUrl != null) return _cachedBaseUrl!;
    if (_compileTimeOverride.isNotEmpty) return _compileTimeOverride;
    if (kIsWeb) return 'http://localhost:5000';
    return 'http://127.0.0.1:5000';
  }

  // Endpoint helpers
  static String loginUrl() => '$baseUrl/api/auth/login';
  static String registerUrl() => '$baseUrl/api/auth/register';
  static String eventsUrl() => '$baseUrl/api/events';
  static String eventDetailUrl(dynamic id) => '$baseUrl/api/events/$id';
  static String registerEventUrl(dynamic id) =>
      '$baseUrl/api/events/$id/register';
  static String myEventsUrl() => '$baseUrl/api/users/me/events';
  static String organizerEventsUrl() => '$baseUrl/api/events/organizer/events';
  static String eventParticipantsUrl(dynamic id) =>
      '$baseUrl/api/events/$id/registrations';
  static String scanQrUrl() => '$baseUrl/api/attendance/scan-qr';
  static String eventAttendanceUrl(dynamic id) =>
      '$baseUrl/api/attendance/event/$id';
  static String uploadAvatarUrl() => '$baseUrl/api/upload/avatar';

  static String resolveMediaUrl(String rawUrl) {
    var url = rawUrl.trim();

    if (url.startsWith('"') && url.endsWith('"') && url.length >= 2) {
      url = url.substring(1, url.length - 1);
    }

    url = url.replaceAll('\\', '/').trim();
    if (url.startsWith('http://') ||
        url.startsWith('https://') ||
        url.startsWith('data:image')) {
      return url;
    }

    if (url.startsWith('//')) {
      return 'https:$url';
    }

    if (url.startsWith('/')) {
      return '$baseUrl$url';
    }

    return '$baseUrl/$url';
  }
}
