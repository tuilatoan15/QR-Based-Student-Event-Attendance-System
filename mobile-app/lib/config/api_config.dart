import 'package:flutter/foundation.dart';

class ApiConfig {
  static String get baseUrl {
    // Web (Chrome/Edge) chạy trên chính máy dev -> gọi backend localhost
    if (kIsWeb) return 'http://localhost:5000';

    // Android emulator hoặc thiết bị -> IP Wi-Fi của máy dev
    // Nếu dùng AVD emulator (Android Studio), thử thay '10.0.2.2' nếu không work
    return 'http://10.78.134.37:5000';
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
}
