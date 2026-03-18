import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/organizer_service.dart';
import '../../models/event.dart';
import '../../models/participant.dart';

class OrganizerParticipantsScreen extends StatefulWidget {
  const OrganizerParticipantsScreen({super.key});

  @override
  State<OrganizerParticipantsScreen> createState() => _OrganizerParticipantsScreenState();
}

class _OrganizerParticipantsScreenState extends State<OrganizerParticipantsScreen> {
  Event? _selectedEvent;
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

  @override
  Widget build(BuildContext context) {
    final service = context.watch<OrganizerService>();

    final filtered = service.participants.where((p) {
      final q = _searchQuery.toLowerCase();
      return q.isEmpty || p.fullName.toLowerCase().contains(q) || (p.email.toLowerCase().contains(q)) || (p.studentCode ?? '').toLowerCase().contains(q);
    }).toList();

    // Prevent DropdownButton assertion error if the selected event is no longer in the list
    Event? safeSelectedEvent = _selectedEvent;
    if (safeSelectedEvent != null && !service.myEvents.contains(safeSelectedEvent)) {
      safeSelectedEvent = null;
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF5F5FF),
      appBar: AppBar(
        title: const Text('Quản lý người tham gia'),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1A1A2E),
      ),
      body: Column(
        children: [
          // ─── Event Picker ───────────────────
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            child: DropdownButtonFormField<Event>(
              value: safeSelectedEvent,
              isExpanded: true,
              hint: const Text('Chọn sự kiện...', style: TextStyle(color: Color(0xFF9E9E9E))),
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.event_rounded, color: Color(0xFF6C63FF)),
                filled: true,
                fillColor: const Color(0xFFF5F5FF),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE0E0E0))),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE0E0E0))),
              ),
              items: service.myEvents.map((e) => DropdownMenuItem(value: e, child: Text(e.title, overflow: TextOverflow.ellipsis))).toList(),
              onChanged: (event) {
                setState(() { _selectedEvent = event; _searchQuery = ''; _searchCtrl.clear(); });
                if (event != null) context.read<OrganizerService>().fetchParticipants(event.id);
              },
            ),
          ),

          // ─── Search Bar ────────────────────
          if (safeSelectedEvent != null)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              child: TextField(
                controller: _searchCtrl,
                onChanged: (v) => setState(() => _searchQuery = v),
                decoration: InputDecoration(
                  hintText: 'Tìm kiếm tên, email, mã SV...',
                  prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF6C63FF)),
                  suffixIcon: _searchQuery.isNotEmpty ? IconButton(icon: const Icon(Icons.clear_rounded), onPressed: () { setState(() => _searchQuery = ''); _searchCtrl.clear(); }) : null,
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE0E0E0))),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE0E0E0))),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                ),
              ),
            ),

          const SizedBox(height: 8),

          // ─── Stats ────────────────────────
          if (safeSelectedEvent != null && !service.isLoading)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  _Badge(label: 'Tổng', count: service.participants.length, color: const Color(0xFF6C63FF)),
                  const SizedBox(width: 8),
                  _Badge(label: 'Đã check-in', count: service.participants.where((p) => p.isCheckedIn).length, color: Colors.green),
                  const SizedBox(width: 8),
                  _Badge(label: 'Chưa check-in', count: service.participants.where((p) => !p.isCheckedIn).length, color: Colors.orange),
                ],
              ),
            ),

          const SizedBox(height: 8),

          // ─── List ──────────────────────────
          Expanded(
            child: safeSelectedEvent == null
                ? const Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(Icons.touch_app_outlined, size: 56, color: Color(0xFFCFCFCF)), SizedBox(height: 12), Text('Chọn sự kiện để xem danh sách', style: TextStyle(color: Color(0xFF9E9E9E)))]))
                : service.isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : RefreshIndicator(
                        onRefresh: () => service.fetchParticipants(safeSelectedEvent!.id),
                        child: filtered.isEmpty
                            ? const Center(child: Text('Không tìm thấy ai', style: TextStyle(color: Color(0xFF9E9E9E))))
                            : ListView.separated(
                                padding: const EdgeInsets.all(16),
                                itemCount: filtered.length,
                                separatorBuilder: (_, __) => const SizedBox(height: 8),
                                itemBuilder: (_, i) => _ParticipantTile(participant: filtered[i]),
                              ),
                      ),
          ),
        ],
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  const _Badge({required this.label, required this.count, required this.color});
  final String label;
  final int count;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
        child: Column(
          children: [
            Text('$count', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
            Text(label, style: TextStyle(fontSize: 10, color: color)),
          ],
        ),
      ),
    );
  }
}

class _ParticipantTile extends StatelessWidget {
  const _ParticipantTile({required this.participant});
  final Participant participant;

  @override
  Widget build(BuildContext context) {
    final checkedIn = participant.isCheckedIn;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: checkedIn ? Colors.green.withOpacity(0.3) : Colors.orange.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 22,
            backgroundColor: checkedIn ? Colors.green.withOpacity(0.15) : Colors.orange.withOpacity(0.15),
            child: Text(participant.fullName.isNotEmpty ? participant.fullName[0].toUpperCase() : '?', style: TextStyle(fontWeight: FontWeight.bold, color: checkedIn ? Colors.green : Colors.orange)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(participant.fullName, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                Text(participant.email, style: const TextStyle(fontSize: 12, color: Color(0xFF9E9E9E))),
                if (participant.studentCode != null)
                  Text('MSSV: ${participant.studentCode}', style: const TextStyle(fontSize: 12, color: Color(0xFF9E9E9E))),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: checkedIn ? Colors.green.withOpacity(0.12) : Colors.orange.withOpacity(0.12),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(checkedIn ? Icons.check_circle_rounded : Icons.schedule_rounded, size: 12, color: checkedIn ? Colors.green : Colors.orange),
                const SizedBox(width: 4),
                Text(checkedIn ? 'Check-in' : 'Đã ĐK', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: checkedIn ? Colors.green : Colors.orange)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
