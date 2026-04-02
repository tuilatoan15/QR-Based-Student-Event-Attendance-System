class Registration {
  final String registrationId;
  final String eventId;
  final String userId;
  final String qrToken;
  final String status;

  Registration({
    required this.registrationId,
    required this.eventId,
    required this.userId,
    required this.qrToken,
    required this.status,
  });

  factory Registration.fromRegisterResponse(Map<String, dynamic> json) {
    // MongoDB Atlas trả về registration object hoặc id trực tiếp
    final reg = json['registration'] is Map<String, dynamic> 
        ? json['registration'] as Map<String, dynamic>
        : (json['data'] is Map<String, dynamic> ? json['data'] as Map<String, dynamic> : json);

    return Registration(
      registrationId: reg['id']?.toString() ?? reg['_id']?.toString() ?? '',
      eventId: reg['event_id']?.toString() ?? reg['eventId']?.toString() ?? '',
      userId: reg['user_id']?.toString() ?? reg['userId']?.toString() ?? '',
      qrToken: json['qr_token']?.toString() ?? reg['qr_token']?.toString() ?? '',
      status: reg['status']?.toString() ?? 'registered',
    );
  }
}
