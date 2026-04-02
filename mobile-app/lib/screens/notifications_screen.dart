import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/notification_service.dart';
import 'event_detail_screen.dart';
import 'report_history_screen.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  static const String routeName = '/notifications';

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NotificationService>().fetchNotifications();
    });
  }

  IconData _getIcon(String? type, String title) {
    if (type == 'registration') return Icons.event_available_rounded;
    if (type == 'cancellation') return Icons.event_busy_rounded;
    if (type == 'checkin') return Icons.how_to_reg_rounded;
    if (type == 'feedback') return Icons.feedback_rounded;
    if (title.contains('Điểm danh')) return Icons.check_circle_rounded;
    return Icons.notifications_active_rounded;
  }

  Color _getColor(String? type, bool isRead) {
    if (isRead) return const Color(0xFF94A3B8);
    if (type == 'registration') return const Color(0xFF10B981);
    if (type == 'cancellation') return const Color(0xFFEF4444);
    if (type == 'checkin') return const Color(0xFF3B82F6);
    if (type == 'feedback') return const Color(0xFFEA580C);
    return const Color(0xFF00CCFF);
  }

  @override
  Widget build(BuildContext context) {
    const accent = Color(0xFF00CCFF);
    final service = context.watch<NotificationService>();

    return Scaffold(
      backgroundColor: const Color(0xFFF0F4FF),
      body: RefreshIndicator(
        onRefresh: () => service.fetchNotifications(),
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              expandedHeight: 120,
              pinned: true,
              backgroundColor: accent,
              actions: [
                if (service.unreadCount > 0)
                  TextButton.icon(
                    onPressed: () => service.markAllAsRead(),
                    icon: const Icon(Icons.done_all_rounded, color: Colors.white, size: 18),
                    label: const Text('Đọc tất cả', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
                  ),
                const SizedBox(width: 8),
              ],
              flexibleSpace: FlexibleSpaceBar(
                background: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFF00CCFF), Color(0xFF0EA5E9)],
                    ),
                  ),
                  child: const SafeArea(
                    child: Padding(
                      padding: EdgeInsets.fromLTRB(20, 0, 20, 20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          Text('Thông báo', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800, letterSpacing: -0.5)),
                          SizedBox(height: 4),
                          Text('Cập nhật mới nhất từ hệ thống', style: TextStyle(color: Colors.white70, fontSize: 13)),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
            if (service.isLoading && service.notifications.isEmpty)
              const SliverFillRemaining(child: Center(child: CircularProgressIndicator(color: accent)))
            else if (service.notifications.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: const BoxDecoration(color: Color(0xFFEFF6FF), shape: BoxShape.circle),
                        child: const Icon(Icons.notifications_off_rounded, size: 48, color: Color(0xFF94A3B8)),
                      ),
                      const SizedBox(height: 16),
                      const Text('Chưa có thông báo nào', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
                    ],
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.all(20),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final notif = service.notifications[index];
                      final iconColor = _getColor(notif.type, notif.isRead);
                      
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: notif.isRead ? Colors.white.withOpacity(0.7) : Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: notif.isRead ? [] : [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4))],
                          border: notif.isRead ? Border.all(color: const Color(0xFFE2E8F0)) : null,
                        ),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(16),
                          onTap: () {
                            if (!notif.isRead) service.markAsRead(notif.id);
                            if (notif.eventId != null) {
                              Navigator.pushNamed(
                                context,
                                EventDetailScreen.routeName,
                                arguments: notif.eventId,
                              );
                            } else if (notif.type == 'feedback') {
                              Navigator.pushNamed(
                                context,
                                ReportHistoryScreen.routeName,
                              );
                            }
                          },
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: iconColor.withOpacity(0.1),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    _getIcon(notif.type, notif.title),
                                    color: iconColor,
                                    size: 20,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        notif.title,
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: notif.isRead ? FontWeight.w600 : FontWeight.w800,
                                          color: notif.isRead ? const Color(0xFF64748B) : const Color(0xFF0F172A),
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(notif.message, style: TextStyle(fontSize: 13, color: notif.isRead ? const Color(0xFF94A3B8) : const Color(0xFF475569))),
                                      const SizedBox(height: 8),
                                      Text(
                                        DateFormat('HH:mm  •  dd/MM/yyyy').format(notif.createdAt.toLocal()),
                                        style: const TextStyle(fontSize: 11, color: Color(0xFFCBD5E1), fontWeight: FontWeight.w500),
                                      ),
                                    ],
                                  ),
                                ),
                                if (!notif.isRead)
                                  Container(
                                    width: 8,
                                    height: 8,
                                    margin: const EdgeInsets.only(top: 4, left: 4),
                                    decoration: BoxDecoration(color: iconColor, shape: BoxShape.circle),
                                  ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                    childCount: service.notifications.length,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
