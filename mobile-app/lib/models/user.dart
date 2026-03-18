class User {
  final int id;
  final String fullName;
  final String email;
  final String role;
  final String? studentCode;
  final String? avatar;

  User({
    required this.id,
    required this.fullName,
    required this.email,
    required this.role,
    this.studentCode,
    this.avatar,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as int,
      fullName: json['full_name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      role: _normalizeRole((json['role_name'] ?? json['role'] ?? '').toString()),
      studentCode: json['student_code'] as String?,
      avatar: json['avatar'] as String?,
    );
  }

  static String _normalizeRole(String rawRole) {
    final lower = rawRole.toLowerCase();
    if (lower == '2' || lower.contains('organizer')) return 'organizer';
    if (lower == '1' || lower.contains('admin')) return 'admin';
    return lower;
  }
}
