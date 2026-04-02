import 'package:flutter/material.dart';
import 'dart:convert';
import '../models/event.dart';
import '../config/api_config.dart';
import '../utils/string_utils.dart';

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

  Color get _accentColor {
    final colors = [
      const Color(0xFF2563EB),
      const Color(0xFF7C3AED),
      const Color(0xFF0891B2),
      const Color(0xFF059669),
      const Color(0xFFD97706),
    ];
    return colors[event.id.hashCode % colors.length];
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: _accentColor.withOpacity(0.12),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Banner Image
            ClipRRect(
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(20),
                topRight: Radius.circular(20),
              ),
              child: Stack(
                children: [
                  AspectRatio(
                    aspectRatio: 21 / 9,
                    child: event.images.isNotEmpty
                        ? _buildImage(event.images[0])
                        : _buildPlaceholder(),
                  ),
                  // Status badge overlay
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.9),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 4)],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (_isOngoing)
                            Container(width: 6, height: 6, margin: const EdgeInsets.only(right: 5), decoration: BoxDecoration(color: _statusColor, shape: BoxShape.circle)),
                          Text(_statusLabel, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: _statusColor)),
                        ],
                      ),
                    ),
                  ),
                  // Registered overlay
                  if (isRegistered)
                    Positioned(
                      top: 12,
                      left: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: const Color(0xFF16A34A).withOpacity(0.9),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.check_circle_rounded, size: 12, color: Colors.white),
                            SizedBox(width: 4),
                            Text('Đã đăng ký', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: Colors.white)),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title
                  Text(
                    event.title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF0F172A),
                      letterSpacing: -0.2,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 6),
                  
                  // Description Snippet
                  if (event.description?.isNotEmpty ?? false)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Text(
                        stripHtml(event.description ?? ""),
                        style: const TextStyle(
                          fontSize: 13,
                          color: Color(0xFF64748B),
                          height: 1.4,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),

                  Row(
                    children: [
                      Icon(Icons.location_on_rounded, size: 14, color: _accentColor),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          event.location,
                          style: TextStyle(fontSize: 12.5, color: _accentColor.withOpacity(0.9), fontWeight: FontWeight.w600),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  
                  // Info row
                  Row(
                    children: [
                      _InfoRow(icon: Icons.calendar_today_rounded, label: _fmtDate(event.startTime)),
                      const SizedBox(width: 14),
                      _InfoRow(icon: Icons.access_time_rounded, label: _fmtTime(event.startTime)),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImage(String rawUrl) {
    final url = ApiConfig.resolveMediaUrl(rawUrl);
    
    // Nếu là Base64, hiển thị qua Image.memory
    if (url.startsWith('data:image')) {
      try {
        final commaIndex = url.indexOf(',');
        if (commaIndex != -1) {
          final base64Str = url.substring(commaIndex + 1);
          return Image.memory(
            base64.decode(base64Str),
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => _buildPlaceholder(),
          );
        }
      } catch (e) {
        return _buildPlaceholder();
      }
    }

    // Nếu là URL bình thường
    return Image.network(
      url,
      fit: BoxFit.cover,
      errorBuilder: (_, __, ___) => _buildPlaceholder(),
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [_accentColor, _accentColor.withOpacity(0.6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.event_note_rounded, color: Colors.white.withOpacity(0.8), size: 40),
            const SizedBox(height: 8),
            Text(
              'XEM CHI TIẾT',
              style: TextStyle(
                color: Colors.white.withOpacity(0.9),
                fontSize: 12,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.2,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.label});
  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: const Color(0xFF94A3B8)),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 12.5, color: Color(0xFF64748B), fontWeight: FontWeight.w500)),
      ],
    );
  }
}