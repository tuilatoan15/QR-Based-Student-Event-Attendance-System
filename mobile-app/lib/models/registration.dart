class Registration {
  final int registrationId;
  final int eventId;
  final int userId;
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
    final reg = json['registration'] as Map<String, dynamic>? ?? {};
    return Registration(
      registrationId: reg['id'] as int,
      eventId: reg['event_id'] as int,
      userId: reg['user_id'] as int,
      qrToken: json['qr_token'] as String? ?? '',
      status: 'registered',
    );
  }
}

