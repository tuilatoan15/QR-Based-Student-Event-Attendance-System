import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../services/organizer_service.dart';
import '../../models/event.dart';
import 'organizer_event_form_screen.dart';
import '../../utils/string_utils.dart';

class OrganizerEventsScreen extends StatefulWidget {
  const OrganizerEventsScreen({super.key});

  @override
  State<OrganizerEventsScreen> createState() => _OrganizerEventsScreenState();
}

class _OrganizerEventsScreenState extends State<OrganizerEventsScreen> {
  final TextEditingController _searchCtrl = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<OrganizerService>().fetchMyEvents();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  String _eventStatus(Event e) {
    final now = DateTime.now();
    if (e.startTime.isAfter(now)) return 'Sắp diễn ra';
    if (e.endTime.isBefore(now)) return 'Đã kết thúc';
    return 'Đang diễn ra';
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'Sắp diễn ra': return const Color(0xFF0284C7);
      case 'Đang diễn ra': return const Color(0xFF16A34A);
      default: return const Color(0xFF94A3B8);
    }
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

    final filtered = service.myEvents.where((e) {
      final q = removeDiacritics(_searchQuery).toLowerCase();
      return q.isEmpty || removeDiacritics(e.title).toLowerCase().contains(q) || removeDiacritics(e.location).toLowerCase().contains(q);
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFF),
      appBar: AppBar(
        title: const Text('Sự kiện của tôi', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, letterSpacing: -0.3)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 0,
        scrolledUnderElevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: const Color(0xFFE0EEFF)),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: ElevatedButton.icon(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const OrganizerEventFormScreen())),
              icon: const Icon(Icons.add_rounded, size: 17),
              label: const Text('Tạo mới', style: TextStyle(fontSize: 13)),
              style: ElevatedButton.styleFrom(
                backgroundColor: accent,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(9)),
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // ─── Search Bar ─────────────────────────────────────────────────────
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
            child: TextField(
              controller: _searchCtrl,
              onChanged: (v) => setState(() => _searchQuery = v),
              decoration: InputDecoration(
                hintText: 'Tìm kiếm sự kiện...',
                hintStyle: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 13.5),
                prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF94A3B8), size: 20),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear_rounded, size: 18),
                        onPressed: () { setState(() => _searchQuery = ''); _searchCtrl.clear(); },
                      )
                    : null,
                filled: true,
                fillColor: const Color(0xFFF8FAFC),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: accent, width: 1.5)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                isDense: true,
              ),
            ),
          ),

          // ─── Count badge ────────────────────────────────────────────────────
          Container(
            color: const Color(0xFFF8FAFF),
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
            child: Row(
              children: [
                Text('${filtered.length} sự kiện', style: const TextStyle(fontSize: 12.5, color: Color(0xFF64748B), fontWeight: FontWeight.w500)),
              ],
            ),
          ),

          // ─── List ────────────────────────────────────────────────────────────
          Expanded(
            child: service.isLoading
                ? const Center(child: CircularProgressIndicator())
                : filtered.isEmpty
                    ? _empty()
                    : RefreshIndicator(
                        color: accent,
                        onRefresh: service.fetchMyEvents,
                        child: ListView.builder(
                          padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                          itemCount: filtered.length,
                          itemBuilder: (_, i) => _EventCard(
                            event: filtered[i],
                            status: _eventStatus(filtered[i]),
                            statusColor: _statusColor(_eventStatus(filtered[i])),
                            onDelete: _deleteEvent,
                          ),
                        ),
                      ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const OrganizerEventFormScreen())),
        backgroundColor: accent,
        foregroundColor: Colors.white,
        child: const Icon(Icons.add_rounded),
      ),
    );
  }

  Widget _empty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.event_busy_outlined, size: 64, color: Color(0xFFCBD5E1)),
          const SizedBox(height: 12),
          const Text('Chưa có sự kiện nào', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Color(0xFF334155))),
          const SizedBox(height: 4),
          const Text('Nhấn + để tạo sự kiện đầu tiên', style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8))),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const OrganizerEventFormScreen())),
            icon: const Icon(Icons.add_rounded),
            label: const Text('Tạo sự kiện'),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6C63FF), foregroundColor: Colors.white),
          ),
        ],
      ),
    );
  }
}

class _EventCard extends StatelessWidget {
  const _EventCard({required this.event, required this.status, required this.statusColor, required this.onDelete});
  final Event event;
  final String status;
  final Color statusColor;
  final Function(Event) onDelete;

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('dd/MM/yy HH:mm');
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE0EEFF)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 3)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Card header with gradient
          Container(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: status == 'Đã kết thúc'
                    ? [const Color(0xFF9E9E9E), const Color(0xFFBDBDBD)]
                    : status == 'Đang diễn ra'
                        ? [const Color(0xFF16A34A), const Color(0xFF22C55E)]
                        : [const Color(0xFF6C63FF), const Color(0xFF4A90D9)],
              ),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    event.title,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14.5),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                  decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(20)),
                  child: Text(status, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ),

          // Card body
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _InfoRow(icon: Icons.access_time_rounded, text: '${dateFormat.format(event.startTime)} → ${dateFormat.format(event.endTime)}'),
                const SizedBox(height: 6),
                _InfoRow(icon: Icons.location_on_outlined, text: event.location),
                if (event.registeredCount != null) ...[
                  const SizedBox(height: 6),
                  _InfoRow(icon: Icons.people_rounded, text: '${event.registeredCount}/${event.maxParticipants} người đăng ký  •  ${event.checkedInCount ?? 0} check-in'),
                ],
                const Divider(height: 18, color: Color(0xFFF1F5F9)),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    _ActionBtn(
                      icon: Icons.edit_rounded,
                      label: 'Sửa',
                      color: const Color(0xFF6C63FF),
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => OrganizerEventFormScreen(event: event))),
                    ),
                    const SizedBox(width: 8),
                    _ActionBtn(
                      icon: Icons.delete_outline_rounded,
                      label: 'Xóa',
                      color: Colors.red,
                      onTap: () => onDelete(event),
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
        Icon(icon, size: 13, color: const Color(0xFF94A3B8)),
        const SizedBox(width: 6),
        Expanded(child: Text(text, style: const TextStyle(fontSize: 12.5, color: Color(0xFF475569)))),
      ],
    );
  }
}

class _ActionBtn extends StatelessWidget {
  const _ActionBtn({required this.icon, required this.label, required this.color, required this.onTap});
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 13, color: color),
            const SizedBox(width: 5),
            Text(label, style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: color)),
          ],
        ),
      ),
    );
  }
}
