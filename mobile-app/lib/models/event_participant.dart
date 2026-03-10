class EventParticipant {
  final int userId;
  final String studentName;
  final String? studentCode;
  final String email;
  final String registrationStatus;
  final DateTime? checkinTime;

  EventParticipant({
    required this.userId,
    required this.studentName,
    this.studentCode,
    required this.email,
    required this.registrationStatus,
    this.checkinTime,
  });

  factory EventParticipant.fromJson(Map<String, dynamic> json) {
    return EventParticipant(
      userId: json['user_id'] as int? ?? 0,
      studentName: json['student_name'] as String? ?? '',
      studentCode: json['student_code'] as String?,
      email: json['email'] as String? ?? '',
      registrationStatus:
          json['registration_status'] as String? ?? 'registered',
      checkinTime: json['checkin_time'] != null
          ? DateTime.parse(json['checkin_time'] as String)
          : null,
    );
  }
}
