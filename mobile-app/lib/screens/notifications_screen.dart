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
    return Scaffold(
      appBar: AppBar(
        title: const Text('Thông báo'),
      ),
      body: Consumer<NotificationService>(
        builder: (context, service, child) {
          if (service.isLoading && service.notifications.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (service.notifications.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.notifications_off_outlined, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  Text('Bạn chưa có thông báo nào.', style: TextStyle(color: Colors.grey)),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => service.fetchNotifications(),
            child: ListView.separated(
              itemCount: service.notifications.length,
              separatorBuilder: (context, index) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final notif = service.notifications[index];
                return ListTile(
                  leading: CircleAvatar(
                    backgroundColor: notif.isRead ? Colors.grey[200] : Colors.blue[50],
                    child: Icon(
                      notif.title.contains('Điểm danh') ? Icons.check_circle : Icons.notifications,
                      color: notif.isRead ? Colors.grey : Colors.blue,
                    ),
                  ),
                  title: Text(
                    notif.title,
                    style: TextStyle(
                      fontWeight: notif.isRead ? FontWeight.normal : FontWeight.bold,
                    ),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 4),
                      Text(notif.message),
                      const SizedBox(height: 4),
                      Text(
                        DateFormat('HH:mm - dd/MM/yyyy').format(notif.createdAt.toLocal()),
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),
                    ],
                  ),
                  isThreeLine: true,
                  onTap: () {
                    if (!notif.isRead) {
                      service.markAsRead(notif.id);
                    }
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }
}
