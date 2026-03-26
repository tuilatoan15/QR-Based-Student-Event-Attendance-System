import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../services/organizer_service.dart';
import '../../models/event.dart';
import '../../models/participant.dart';
import '../../utils/string_utils.dart';

class OrganizerAttendanceScreen extends StatefulWidget {
  const OrganizerAttendanceScreen({super.key});

  @override
  State<OrganizerAttendanceScreen> createState() => _OrganizerAttendanceScreenState();
}

class _OrganizerAttendanceScreenState extends State<OrganizerAttendanceScreen> {
  Event? _selectedEvent;
  final TextEditingController _searchCtrl = TextEditingController();
  String _searchQuery = '';
  String _filterStatus = 'all'; // 'all', 'checkedIn', 'notCheckedIn', 'cancelled'

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

  Future<void> _selectEvent(Event? event) async {
    setState(() {
      _selectedEvent = event;
      _searchQuery = '';
      _searchCtrl.clear();
      _filterStatus = 'all';
    });
    if (event != null) {
      await context.read<OrganizerService>().fetchAttendanceForEvent(event.id);
    }
  }

  Future<void> _manualCheckIn(Participant p) async {
    if (_selectedEvent == null || p.studentCode == null || p.studentCode!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Hệ thống thiếu Mã sinh viên để điểm danh thủ công.'), backgroundColor: Colors.red),
      );
      return;
    }
    final svc = context.read<OrganizerService>();
    final success = await svc.manualCheckIn(_selectedEvent!.id, p.studentCode!);
    if (!mounted) return;
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Đã điểm danh cho ${p.fullName}'), backgroundColor: Colors.green),
      );
    } else {
      if (svc.errorMessage != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(svc.errorMessage!), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final svc = context.watch<OrganizerService>();
    const accent = Color(0xFF6C63FF);

    // 1. Search filter
    final searched = svc.attendance.where((p) {
      final q = removeDiacritics(_searchQuery).toLowerCase();
      return q.isEmpty ||
          removeDiacritics(p.fullName).toLowerCase().contains(q) ||
          removeDiacritics(p.email).toLowerCase().contains(q) ||
          removeDiacritics(p.studentCode ?? '').toLowerCase().contains(q);
    }).toList();

    // Calculate total counts based on search (regardless of status filter)
    final checkedInCount = searched.where((p) => p.isCheckedIn).length;
    final cancelledCount = searched.where((p) => p.isCancelled).length;
    final notCheckedInCount = searched.where((p) => !p.isCheckedIn && !p.isCancelled).length;

    // 2. Status filter
    final filtered = searched.where((p) {
      if (_filterStatus == 'checkedIn' && !p.isCheckedIn) return false;
      if (_filterStatus == 'notCheckedIn' && (p.isCheckedIn || p.isCancelled)) return false;
      if (_filterStatus == 'cancelled' && !p.isCancelled) return false;
      return true;
    }).toList();

    // Prevent DropdownButton assertion error if the selected event is no longer in the list
    Event? safeSelectedEvent = _selectedEvent;
    if (safeSelectedEvent != null && !svc.myEvents.contains(safeSelectedEvent)) {
      // If the selected event was deleted or not found, we reset the selection.
      // We don't call setState here during build, just pass null (or correct item) to Dropdown
      safeSelectedEvent = null;
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFF),
      appBar: AppBar(
        title: const Text('Điểm danh', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, letterSpacing: -0.3)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 0,
        scrolledUnderElevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: const Color(0xFFE0EEFF)),
        ),
      ),
      body: Column(
        children: [
          // ─── Event Picker ────────────────────────────────────────────────
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
            child: DropdownButtonFormField<Event>(
              value: safeSelectedEvent,
              isExpanded: true,
              icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF6C63FF)),
              hint: const Text('Chọn sự kiện để xem điểm danh...', style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 13.5)),
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.event_rounded, color: Color(0xFF6C63FF), size: 20),
                filled: true,
                fillColor: const Color(0xFFF8FAFC),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: accent, width: 1.5)),
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                isDense: true,
              ),
              items: svc.myEvents.map((e) => DropdownMenuItem(
                value: e,
                child: Text(e.title, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w500)),
              )).toList(),
              onChanged: _selectEvent,
            ),
          ),

          if (_selectedEvent != null) ...[
            // ─── Search Bar ────────────────────────────────────────────────
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
              child: TextField(
                controller: _searchCtrl,
                onChanged: (v) => setState(() => _searchQuery = v),
                decoration: InputDecoration(
                  hintText: 'Tìm tên, email, mã sinh viên...',
                  hintStyle: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 13),
                  prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF94A3B8), size: 19),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(icon: const Icon(Icons.clear_rounded, size: 17), onPressed: () { setState(() => _searchQuery = ''); _searchCtrl.clear(); })
                      : null,
                  filled: true,
                  fillColor: const Color(0xFFF8FAFC),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(9), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(9), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(9), borderSide: const BorderSide(color: accent, width: 1.5)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                  isDense: true,
                ),
              ),
            ),

            // ─── Stats Row ──────────────────────────────────────────────────
            if (!svc.isLoading)
              Container(
                margin: const EdgeInsets.fromLTRB(16, 4, 16, 8),
                child: Row(
                  children: [
                    _StatBadge(
                      label: 'Tổng', 
                      count: searched.length, 
                      color: const Color(0xFF6C63FF),
                      isSelected: _filterStatus == 'all',
                      onTap: () => setState(() => _filterStatus = 'all'),
                    ),
                    const SizedBox(width: 8),
                    _StatBadge(
                      label: 'Đã check-in', 
                      count: checkedInCount, 
                      color: const Color(0xFF16A34A),
                      isSelected: _filterStatus == 'checkedIn',
                      onTap: () => setState(() => _filterStatus = 'checkedIn'),
                    ),
                    const SizedBox(width: 8),
                    _StatBadge(
                      label: 'Chưa ĐD', 
                      count: notCheckedInCount, 
                      color: const Color(0xFFF59E0B),
                      isSelected: _filterStatus == 'notCheckedIn',
                      onTap: () => setState(() => _filterStatus = 'notCheckedIn'),
                    ),
                    const SizedBox(width: 8),
                    _StatBadge(
                      label: 'Đã hủy', 
                      count: cancelledCount, 
                      color: const Color(0xFFEF4444),
                      isSelected: _filterStatus == 'cancelled',
                      onTap: () => setState(() => _filterStatus = 'cancelled'),
                    ),
                  ],
                ),
              ),
          ],

          // ─── List ─────────────────────────────────────────────────────────
          Expanded(
            child: safeSelectedEvent == null
                ? _noEventSelected()
                : svc.isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : filtered.isEmpty
                        ? _noResults()
                        : RefreshIndicator(
                            color: accent,
                            onRefresh: () => svc.fetchAttendanceForEvent(safeSelectedEvent!.id),
                            child: ListView.builder(
                              padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                              itemCount: filtered.length,
                              itemBuilder: (_, i) {
                                final p = filtered[i];
                                return _ParticipantCard(
                                  participant: p,
                                  onManualCheckIn: () => _manualCheckIn(p),
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _noEventSelected() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(color: const Color(0xFFF0EEFF), shape: BoxShape.circle),
            child: const Icon(Icons.touch_app_outlined, size: 52, color: Color(0xFF6C63FF)),
          ),
          const SizedBox(height: 16),
          const Text('Chọn sự kiện để xem điểm danh', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15.5, color: Color(0xFF334155))),
          const SizedBox(height: 6),
          const Text('Danh sách sinh viên đăng ký và trạng thái check-in', style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8)), textAlign: TextAlign.center),
        ],
      ),
    );
  }

  Widget _noResults() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off_rounded, size: 52, color: Color(0xFFCBD5E1)),
          SizedBox(height: 12),
          Text('Không tìm thấy kết quả', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Color(0xFF334155))),
          SizedBox(height: 4),
          Text('Thử tìm kiếm với từ khóa khác', style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8))),
        ],
      ),
    );
  }
}

// ─── Stat Badge ───────────────────────────────────────────────────────────────

class _StatBadge extends StatelessWidget {
  const _StatBadge({
    required this.label,
    required this.count,
    required this.color,
    this.isSelected = false,
    this.onTap,
  });
  final String label;
  final int count;
  final Color color;
  final bool isSelected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 9),
          decoration: BoxDecoration(
            color: isSelected ? color : color.withOpacity(0.08),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: isSelected ? color : color.withOpacity(0.2)),
            boxShadow: isSelected ? [BoxShadow(color: color.withOpacity(0.3), blurRadius: 6, offset: const Offset(0, 3))] : null,
          ),
          alignment: Alignment.center,
          child: Column(
            children: [
              Text('$count', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: isSelected ? Colors.white : color)),
              const SizedBox(height: 1),
              Text(label, style: TextStyle(fontSize: 10.5, color: isSelected ? Colors.white.withOpacity(0.9) : color.withOpacity(0.8), fontWeight: FontWeight.w500)),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Participant Card ─────────────────────────────────────────────────────────

class _ParticipantCard extends StatelessWidget {
  const _ParticipantCard({required this.participant, this.onManualCheckIn});
  final Participant participant;
  final VoidCallback? onManualCheckIn;

  @override
  Widget build(BuildContext context) {
    final checkedIn = participant.isCheckedIn;
    final timeFormat = DateFormat('HH:mm dd/MM/yy');
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: checkedIn ? const Color(0xFFBBF7D0) : const Color(0xFFE2E8F0),
          width: 1.3,
        ),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 6, offset: const Offset(0, 2)),
        ],
      ),
      child: Row(
        children: [
          // Avatar circle
          CircleAvatar(
            radius: 22,
            backgroundColor: checkedIn ? const Color(0xFFF0FDF4) : const Color(0xFFF1F5F9),
            child: Text(
              participant.fullName.isNotEmpty ? participant.fullName[0].toUpperCase() : '?',
              style: TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 16,
                color: checkedIn ? const Color(0xFF16A34A) : const Color(0xFF64748B),
              ),
            ),
          ),
          const SizedBox(width: 12),

          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(participant.fullName, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13.5, color: Color(0xFF0F172A))),
                const SizedBox(height: 2),
                Text(participant.email, style: const TextStyle(fontSize: 11.5, color: Color(0xFF94A3B8)), maxLines: 1, overflow: TextOverflow.ellipsis),
                if (participant.studentCode != null && participant.studentCode!.isNotEmpty)
                  Text('MSSV: ${participant.studentCode}', style: const TextStyle(fontSize: 11.5, color: Color(0xFF94A3B8))),
                if (participant.checkInTime != null && checkedIn) ...[
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      const Icon(Icons.access_time_rounded, size: 11, color: Color(0xFF16A34A)),
                      const SizedBox(width: 3),
                      Text(timeFormat.format(participant.checkInTime!), style: const TextStyle(fontSize: 11, color: Color(0xFF16A34A), fontWeight: FontWeight.w500)),
                    ],
                  ),
                ],
              ],
            ),
          ),

          // Status badge / Manual checkin button
          if (participant.isCancelled)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFFEE2E2)),
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.cancel_rounded, size: 13, color: Color(0xFFEF4444)),
                  SizedBox(width: 4),
                  Text('Đã hủy', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: Color(0xFFEF4444))),
                ],
              ),
            )
          else if (!checkedIn && participant.studentCode != null && participant.studentCode!.isNotEmpty)
            GestureDetector(
              onTap: onManualCheckIn,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFF6C63FF),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [BoxShadow(color: const Color(0xFF6C63FF).withOpacity(0.3), blurRadius: 4, offset: const Offset(0, 2))],
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.touch_app_rounded, size: 13, color: Colors.white),
                    SizedBox(width: 4),
                    Text('Điểm danh', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: Colors.white)),
                  ],
                ),
              ),
            )
          else
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: checkedIn ? const Color(0xFFF0FDF4) : const Color(0xFFFFF8F0),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: checkedIn ? const Color(0xFFBBF7D0) : const Color(0xFFFDE68A)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    checkedIn ? Icons.check_circle_rounded : Icons.schedule_rounded,
                    size: 13,
                    color: checkedIn ? const Color(0xFF16A34A) : const Color(0xFFF59E0B),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    checkedIn ? 'Đã điểm danh' : 'Chưa ĐD',
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w600,
                      color: checkedIn ? const Color(0xFF16A34A) : const Color(0xFFF59E0B),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
