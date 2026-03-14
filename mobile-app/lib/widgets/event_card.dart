import 'package:flutter/material.dart';
import '../models/event.dart';

class EventCard extends StatelessWidget {
  const EventCard({
    super.key,
    required this.event,
    this.onTap,
    this.isRegistered = false,
    this.isOrganizer = false,
    this.onEdit,
    this.onDelete,
    this.onViewRegistrations,
    this.onScanQr,
  });

  final Event event;
  final VoidCallback? onTap;
  final bool isRegistered;
  final bool isOrganizer;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;
  final VoidCallback? onViewRegistrations;
  final VoidCallback? onScanQr;

  bool get _isUpcoming => event.startTime.isAfter(DateTime.now());
  bool get _isOngoing =>
      DateTime.now().isAfter(event.startTime) &&
      DateTime.now().isBefore(event.endTime);

  String get _statusLabel {
    if (_isOngoing) return 'Đang diễn ra';
    if (_isUpcoming) return 'Sắp tới';
    return 'Đã kết thúc';
  }

  Color get _statusColor {
    if (_isOngoing) return const Color(0xFF16A34A);
    if (_isUpcoming) return const Color(0xFF2563EB);
    return const Color(0xFF94A3B8);
  }

  Color get _statusBg {
    if (_isOngoing) return const Color(0xFFF0FDF4);
    if (_isUpcoming) return const Color(0xFFEFF6FF);
    return const Color(0xFFF8FAFC);
  }

  String _fmtDate(DateTime dt) {
    final d = dt.toLocal();
    const months = ['Thg 1','Thg 2','Thg 3','Thg 4','Thg 5','Thg 6','Thg 7','Thg 8','Thg 9','Thg 10','Thg 11','Thg 12'];
    return '${d.day} ${months[d.month - 1]}, ${d.year}';
  }

  String _fmtTime(DateTime dt) {
    final d = dt.toLocal();
    return '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
  }

  // Color accent based on event id
  Color get _accentColor {
    final colors = [
      const Color(0xFF2563EB),
      const Color(0xFF7C3AED),
      const Color(0xFF0891B2),
      const Color(0xFF059669),
      const Color(0xFFD97706),
    ];
    return colors[event.id % colors.length];
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: _accentColor.withOpacity(0.08),
              blurRadius: 16,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Color accent bar + header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    _accentColor.withOpacity(0.08),
                    _accentColor.withOpacity(0.03),
                  ],
                ),
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(18),
                  topRight: Radius.circular(18),
                ),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Icon box
                  Container(
                    width: 46,
                    height: 46,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [_accentColor, _accentColor.withOpacity(0.7)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(13),
                    ),
                    child: const Icon(Icons.event_rounded, color: Colors.white, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          event.title,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF0F172A),
                            letterSpacing: -0.2,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 5),
                        Row(
                          children: [
                            Icon(Icons.location_on_rounded, size: 13, color: _accentColor),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                event.location,
                                style: TextStyle(fontSize: 12, color: _accentColor.withOpacity(0.8), fontWeight: FontWeight.w500),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Status badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
                    decoration: BoxDecoration(
                      color: _statusBg,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: _statusColor.withOpacity(0.2)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (_isOngoing)
                          Container(
                            width: 6,
                            height: 6,
                            margin: const EdgeInsets.only(right: 5),
                            decoration: BoxDecoration(
                              color: _statusColor,
                              shape: BoxShape.circle,
                            ),
                          ),
                        Text(
                          _statusLabel,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: _statusColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Divider
            Divider(height: 1, color: const Color(0xFFE2E8F0).withOpacity(0.6)),

            // Info row
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  _InfoChip(
                    icon: Icons.calendar_today_rounded,
                    label: _fmtDate(event.startTime),
                    color: _accentColor,
                  ),
                  const SizedBox(width: 12),
                  _InfoChip(
                    icon: Icons.access_time_rounded,
                    label: _fmtTime(event.startTime),
                    color: _accentColor,
                  ),
                  const Spacer(),
                  _InfoChip(
                    icon: Icons.people_outline_rounded,
                    label: '${event.maxParticipants}',
                    color: _accentColor,
                  ),
                ],
              ),
            ),

            // Registered badge or arrow
            if (isRegistered || onTap != null)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
                child: Row(
                  children: [
                    if (isRegistered)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0FDF4),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: const Color(0xFFBBF7D0)),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.check_circle_rounded, size: 13, color: Color(0xFF16A34A)),
                            SizedBox(width: 5),
                            Text('Đã đăng ký', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: Color(0xFF15803D))),
                          ],
                        ),
                      ),
                    const Spacer(),
                    if (onTap != null)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: _accentColor.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text('Xem chi tiết', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: _accentColor)),
                            const SizedBox(width: 4),
                            Icon(Icons.arrow_forward_ios_rounded, size: 10, color: _accentColor),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.icon, required this.label, required this.color});
  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: color.withOpacity(0.6)),
        const SizedBox(width: 4),
        Text(label, style: TextStyle(fontSize: 12, color: const Color(0xFF64748B), fontWeight: FontWeight.w500)),
      ],
    );
  }
}