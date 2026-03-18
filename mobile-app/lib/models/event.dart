class Event {
  final int id;
  final String title;
  final String? description;
  final String location;
  final DateTime startTime;
  final DateTime endTime;
  final int maxParticipants;
  final int? registeredCount;
  final int? checkedInCount;
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
    this.registeredCount,
    this.checkedInCount,
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
      registeredCount: json['registered_count'] as int?,
      checkedInCount: json['checked_in_count'] as int?,
      googleSheetId: json['google_sheet_id'] as String?,
      googleSheetName: json['google_sheet_name'] as String?,
      googleSheetUrl: json['google_sheet_url'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'description': description,
      'location': location,
      'start_time': startTime.toIso8601String(),
      'end_time': endTime.toIso8601String(),
      'max_participants': maxParticipants,
    };
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Event && runtimeType == other.runtimeType && id == other.id;

  @override
  int get hashCode => id.hashCode;
}
