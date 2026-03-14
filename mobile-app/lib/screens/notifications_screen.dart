import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../services/notification_service.dart';

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

  @override
  Widget build(BuildContext context) {
    const accent = Color(0xFF00CCFF);

    return Scaffold(
      backgroundColor: const Color(0xFFF0F4FF),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 120,
            pinned: true,
            backgroundColor: accent,
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
          Consumer<NotificationService>(
            builder: (context, service, child) {
              if (service.isLoading && service.notifications.isEmpty) {
                return const SliverFillRemaining(child: Center(child: CircularProgressIndicator(color: accent)));
              }

              if (service.notifications.isEmpty) {
                return SliverFillRemaining(
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
                );
              }

              return SliverPadding(
                padding: const EdgeInsets.all(20),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final notif = service.notifications[index];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: notif.isRead ? Colors.white.withOpacity(0.7) : Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: notif.isRead ? [] : [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4))],
                          border: notif.isRead ? Border.all(color: const Color(0xFFE2E8F0)) : null,
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.all(12),
                          onTap: () {
                            if (!notif.isRead) service.markAsRead(notif.id);
                          },
                          leading: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: notif.isRead ? const Color(0xFFF1F5F9) : const Color(0xFFF0F9FF),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              notif.title.contains('Điểm danh') ? Icons.check_circle_rounded : Icons.notifications_active_rounded,
                              color: notif.isRead ? const Color(0xFF94A3B8) : accent,
                              size: 20,
                            ),
                          ),
                          title: Text(
                            notif.title,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: notif.isRead ? FontWeight.w600 : FontWeight.w800,
                              color: notif.isRead ? const Color(0xFF64748B) : const Color(0xFF0F172A),
                            ),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 4),
                              Text(notif.message, style: TextStyle(fontSize: 13, color: notif.isRead ? const Color(0xFF94A3B8) : const Color(0xFF475569))),
                              const SizedBox(height: 6),
                              Text(
                                DateFormat('HH:mm  •  dd/MM/yyyy').format(notif.createdAt.toLocal()),
                                style: const TextStyle(fontSize: 11, color: Color(0xFFCBD5E1), fontWeight: FontWeight.w500),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                    childCount: service.notifications.length,
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
