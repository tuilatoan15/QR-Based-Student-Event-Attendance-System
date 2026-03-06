class ApiConfig {
  static const String baseUrl = 'http://10.0.2.2:5000';

  static String loginUrl() => '$baseUrl/api/auth/login';
  static String registerUrl() => '$baseUrl/api/auth/register';
  static String eventsUrl() => '$baseUrl/api/events';
  static String eventDetailUrl(int id) => '$baseUrl/api/events/$id';
  static String registerEventUrl(int id) => '$baseUrl/api/events/$id/register';
  static String myEventsUrl() => '$baseUrl/api/users/me/events';
}
