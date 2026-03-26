import 'package:flutter/foundation.dart';

class ApiConfig {
  static const String _overrideBaseUrl = String.fromEnvironment('API_BASE_URL');

  static String get baseUrl {
    if (_overrideBaseUrl.isNotEmpty) {
      return _overrideBaseUrl;
    }

    if (kIsWeb) {
      return 'http://localhost:5000';
    }

    // Default to the current LAN IP of the development machine so
    // physical Android devices on the same Wi-Fi can reach the backend.
    return 'http://10.230.241.37:5000';
  }

  static String loginUrl() => '$baseUrl/api/auth/login';
  static String registerUrl() => '$baseUrl/api/auth/register';
  static String eventsUrl() => '$baseUrl/api/events';
  static String eventDetailUrl(int id) => '$baseUrl/api/events/$id';
  static String registerEventUrl(int id) => '$baseUrl/api/events/$id/register';
  static String myEventsUrl() => '$baseUrl/api/users/me/events';
  static String organizerEventsUrl() => '$baseUrl/api/events/organizer/events';
  static String eventParticipantsUrl(int id) =>
      '$baseUrl/api/events/$id/registrations';
  static String scanQrUrl() => '$baseUrl/api/attendance/scan-qr';
  static String eventAttendanceUrl(int id) =>
      '$baseUrl/api/attendance/event/$id';
  static String uploadAvatarUrl() => '$baseUrl/api/upload/avatar';

  static String resolveMediaUrl(String rawUrl) {
    var url = rawUrl.trim();

    if (url.startsWith('"') && url.endsWith('"') && url.length >= 2) {
      url = url.substring(1, url.length - 1);
    }

    url = url.replaceAll('\\/', '/').trim();

    if (url.startsWith('http://') || url.startsWith('https://')) {
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
