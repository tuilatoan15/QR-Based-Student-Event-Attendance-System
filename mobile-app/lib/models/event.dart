class Event {
  final int id;
  final String title;
  final String? description;
  final String location;
  final DateTime startTime;
  final DateTime endTime;
  final int maxParticipants;
  final String? googleSheetId;
  final String? googleSheetName;
  final String? googleSheetUrl;

  Event({
    required this.id,
    required this.title,
    this.description,
    required this.location,
    required this.startTime,
    required this.endTime,
    required this.maxParticipants,
    this.googleSheetId,
    this.googleSheetName,
    this.googleSheetUrl,
  });

  factory Event.fromJson(Map<String, dynamic> json) {
    return Event(
      id: json['id'] as int,
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      location: json['location'] as String? ?? '',
      startTime: DateTime.parse(json['start_time'] as String),
      endTime: DateTime.parse(json['end_time'] as String),
      maxParticipants: json['max_participants'] as int? ?? 0,
      googleSheetId: json['google_sheet_id'] as String?,
      googleSheetName: json['google_sheet_name'] as String?,
      googleSheetUrl: json['google_sheet_url'] as String?,
    );
  }
}
