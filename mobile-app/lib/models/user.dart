class User {
  final int id;
  final String fullName;
  final String email;
  final String role;
  final String? studentCode;

  User({
    required this.id,
    required this.fullName,
    required this.email,
    required this.role,
    this.studentCode,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as int,
      fullName: json['full_name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      role: (json['role_name'] ?? json['role'] ?? '').toString(),
      studentCode: json['student_code'] as String?,
    );
  }
}
