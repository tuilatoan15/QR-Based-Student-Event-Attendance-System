import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../services/organizer_service.dart';
import '../../models/event.dart';
import 'organizer_event_form_screen.dart';

class OrganizerEventsScreen extends StatefulWidget {
  const OrganizerEventsScreen({super.key});

  @override
  State<OrganizerEventsScreen> createState() => _OrganizerEventsScreenState();
}

class _OrganizerEventsScreenState extends State<OrganizerEventsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<OrganizerService>().fetchMyEvents();
    });
  }

  Future<void> _deleteEvent(Event event) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Xác nhận xóa'),
        content: Text('Bạn có chắc muốn xóa sự kiện "${event.title}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Hủy')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Xóa'),
          ),
        ],
      ),
    );
    if (confirm == true && mounted) {
      final success = await context.read<OrganizerService>().deleteEvent(event.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(success ? 'Đã xóa sự kiện' : (context.read<OrganizerService>().errorMessage ?? 'Lỗi xóa')),
          backgroundColor: success ? Colors.green : Colors.red,
        ));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final service = context.watch<OrganizerService>();
    const accent = Color(0xFF6C63FF);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F5FF),
      appBar: AppBar(
        title: const Text('Sự kiện của tôi'),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1A1A2E),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: ElevatedButton.icon(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const OrganizerEventFormScreen())),
              icon: const Icon(Icons.add_rounded, size: 18),
              label: const Text('Tạo mới'),
              style: ElevatedButton.styleFrom(backgroundColor: accent, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8)),
            ),
          ),
        ],
      ),
      body: service.isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: service.fetchMyEvents,
              child: service.myEvents.isEmpty
                  ? _empty()
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: service.myEvents.length,
                      itemBuilder: (_, i) => _EventCard(event: service.myEvents[i], onDelete: _deleteEvent),
                    ),
            ),
    );
  }

  Widget _empty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.event_busy_outlined, size: 64, color: Color(0xFFCFCFCF)),
          const SizedBox(height: 12),
          const Text('Chưa có sự kiện nào', style: TextStyle(fontSize: 16, color: Color(0xFF9E9E9E))),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const OrganizerEventFormScreen())),
            icon: const Icon(Icons.add_rounded),
            label: const Text('Tạo sự kiện đầu tiên'),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6C63FF)),
          ),
        ],
      ),
    );
  }
}

class _EventCard extends StatelessWidget {
  const _EventCard({required this.event, required this.onDelete});
  final Event event;
  final Function(Event) onDelete;

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('dd/MM/yy HH:mm');
    final isUpcoming = event.startTime.isAfter(DateTime.now());
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: isUpcoming
                    ? [const Color(0xFF6C63FF), const Color(0xFF4A90D9)]
                    : [const Color(0xFF9E9E9E), const Color(0xFFBDBDBD)],
              ),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(event.title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15), maxLines: 2, overflow: TextOverflow.ellipsis),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(8)),
                  child: Text(
                    isUpcoming ? 'Sắp diễn ra' : 'Đã qua',
                    style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _InfoRow(icon: Icons.access_time_rounded, text: '${dateFormat.format(event.startTime)} → ${dateFormat.format(event.endTime)}'),
                const SizedBox(height: 6),
                _InfoRow(icon: Icons.location_on_outlined, text: event.location),
                if (event.registeredCount != null) ...[
                  const SizedBox(height: 6),
                  _InfoRow(icon: Icons.people_rounded, text: '${event.registeredCount}/${event.maxParticipants} người đăng ký'),
                ],
                const Divider(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton.icon(
                      onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => OrganizerEventFormScreen(event: event))),
                      icon: const Icon(Icons.edit_rounded, size: 16, color: Color(0xFF6C63FF)),
                      label: const Text('Sửa', style: TextStyle(color: Color(0xFF6C63FF))),
                    ),
                    TextButton.icon(
                      onPressed: () => onDelete(event),
                      icon: const Icon(Icons.delete_rounded, size: 16, color: Colors.red),
                      label: const Text('Xóa', style: TextStyle(color: Colors.red)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.text});
  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 14, color: const Color(0xFF9E9E9E)),
        const SizedBox(width: 6),
        Expanded(child: Text(text, style: const TextStyle(fontSize: 13, color: Color(0xFF555555)))),
      ],
    );
  }
}
