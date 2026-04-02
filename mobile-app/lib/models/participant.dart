class Participant {
  final String id;
  final String fullName;
  final String email;
  final String? studentCode;
  final String? avatar;
  final String status; // 'registered' | 'checked_in' | 'cancelled'
  final DateTime? checkInTime;

  Participant({
    required this.id,
    required this.fullName,
    required this.email,
    this.studentCode,
    this.avatar,
    required this.status,
    this.checkInTime,
  });

  bool get isCheckedIn => status == 'checked_in';
  bool get isCancelled => status == 'cancelled';

  factory Participant.fromJson(Map<String, dynamic> json) {
    return Participant(
      id: (json['user_id'] ?? json['id'] ?? json['_id'] ?? '').toString(),
      fullName: (json['full_name'] ?? json['name'] ?? json['student_name'] ?? '') as String,
      email: (json['email'] ?? '') as String,
      studentCode: (json['student_code'] ?? json['student_id'] ?? '').toString(),
      avatar: json['avatar'] as String?,
      status: (json['status'] ?? 'registered') as String,
      checkInTime: json['check_in_time'] != null
          ? DateTime.tryParse(json['check_in_time'].toString().endsWith('Z') ? json['check_in_time'] : '${json['check_in_time']}Z')?.toLocal()
          : null,
    );
  }
}
