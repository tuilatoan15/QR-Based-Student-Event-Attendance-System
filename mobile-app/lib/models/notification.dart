class AppNotification {
  final String id;
  final String title;
  final String message;
  final bool isRead;
  final DateTime createdAt;
  final String? type;
  final String? eventId;

  AppNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.isRead,
    required this.createdAt,
    this.type,
    this.eventId,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      isRead: json['is_read'] == true || json['is_read'] == 1,
      createdAt: DateTime.parse(json['created_at'] ?? DateTime.now().toIso8601String()),
      type: json['type'],
      eventId: json['event_id']?.toString(),
    );
  }
}
