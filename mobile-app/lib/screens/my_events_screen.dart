import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/event.dart';
import '../services/event_service.dart';
import 'qr_screen.dart';

class MyEventsScreen extends StatefulWidget {
  const MyEventsScreen({super.key});
  static const String routeName = '/my-events';

  @override
  State<MyEventsScreen> createState() => _MyEventsScreenState();
}

class _MyEventsScreenState extends State<MyEventsScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => context.read<EventService>().fetchMyEvents());
  }

  Future<void> _showQR(Event event) async {
    final svc = context.read<EventService>();
    final registration = svc.getRegistration(event.id);
    if (registration == null || !mounted) return;
    Navigator.of(context).pushNamed(QRScreen.routeName, arguments: {'event': event, 'registration': registration});
  }

  Future<void> _cancel(Event event) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Huỷ đăng ký', style: TextStyle(fontWeight: FontWeight.w700)),
        content: Text('Huỷ đăng ký "${event.title}"?', style: const TextStyle(color: Color(0xFF64748B))),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Không')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFEF4444)),
            child: const Text('Huỷ đăng ký'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    final svc = context.read<EventService>();
    final ok = await svc.cancelRegistration(event.id);
    if (!mounted) return;
    if (ok) {
      await svc.fetchMyEvents();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đã huỷ đăng ký'), backgroundColor: Color(0xFF16A34A)),
      );
    } else if (svc.errorMessage != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(svc.errorMessage!), backgroundColor: const Color(0xFFEF4444)));
    }
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

  Color _accentFor(int id) {
    final colors = [const Color(0xFF00CCFF), const Color(0xFF7C3AED), const Color(0xFF0891B2), const Color(0xFF059669), const Color(0xFFEA580C)];
    return colors[id % colors.length];
  }

  @override
  Widget build(BuildContext context) {
    final svc = context.watch<EventService>();

    return Scaffold(
      backgroundColor: const Color(0xFFF0F4FF),
      body: RefreshIndicator(
        color: const Color(0xFF2563EB),
        onRefresh: () => svc.fetchMyEvents(),
        child: CustomScrollView(
          slivers: [
            // App bar
            SliverAppBar(
              pinned: true,
              expandedHeight: 140,
              backgroundColor: const Color(0xFF00CCFF),
              leading: Padding(
                padding: const EdgeInsets.all(8),
                child: GestureDetector(
                  onTap: () { if (Navigator.canPop(context)) Navigator.pop(context); },
                  child: Container(
                    decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(10)),
                    child: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 16),
                  ),
                ),
              ),
              flexibleSpace: FlexibleSpaceBar(
                background: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFF00B4D8), Color(0xFF00CCFF)],
                    ),
                  ),
                  child: SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 40, 20, 20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          const Text('Sự kiện của tôi', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w800, letterSpacing: -0.4)),
                          const SizedBox(height: 4),
                          Text(
                            '${svc.myEvents.length} sự kiện đã đăng ký',
                            style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 13.5),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),

            if (svc.isLoading && svc.myEvents.isEmpty)
              const SliverFillRemaining(child: Center(child: CircularProgressIndicator(color: Color(0xFF2563EB))))
            else if (svc.myEvents.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: const BoxDecoration(color: Color(0xFFEFF6FF), shape: BoxShape.circle),
                          child: const Icon(Icons.bookmark_border_rounded, size: 40, color: Color(0xFF2563EB)),
                        ),
                        const SizedBox(height: 16),
                        const Text('Chưa có sự kiện', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
                        const SizedBox(height: 6),
                        const Text('Hãy khám phá và đăng ký sự kiện yêu thích', style: TextStyle(fontSize: 13.5, color: Color(0xFF94A3B8)), textAlign: TextAlign.center),
                      ],
                    ),
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.all(20),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final event = svc.myEvents[index];
                      final accent = _accentFor(event.id);
                      final isUpcoming = event.startTime.isAfter(DateTime.now());

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          boxShadow: [BoxShadow(color: accent.withOpacity(0.08), blurRadius: 16, offset: const Offset(0, 4))],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Header
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(colors: [accent.withOpacity(0.08), accent.withOpacity(0.02)]),
                                borderRadius: const BorderRadius.only(topLeft: Radius.circular(18), topRight: Radius.circular(18)),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    width: 44,
                                    height: 44,
                                    decoration: BoxDecoration(
                                      gradient: LinearGradient(colors: [accent, accent.withOpacity(0.7)]),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: const Icon(Icons.event_note_rounded, color: Colors.white, size: 20),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(event.title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF0F172A), letterSpacing: -0.2), maxLines: 2, overflow: TextOverflow.ellipsis),
                                        const SizedBox(height: 4),
                                        Row(
                                          children: [
                                            Icon(Icons.location_on_rounded, size: 12, color: accent),
                                            const SizedBox(width: 3),
                                            Expanded(child: Text(event.location, style: TextStyle(fontSize: 12, color: accent.withOpacity(0.8)), maxLines: 1, overflow: TextOverflow.ellipsis)),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFF0FDF4),
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(color: const Color(0xFFBBF7D0)),
                                    ),
                                    child: const Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(Icons.check_circle_rounded, size: 11, color: Color(0xFF16A34A)),
                                        SizedBox(width: 4),
                                        Text('Đã đk', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: Color(0xFF15803D))),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            Divider(height: 1, color: const Color(0xFFE2E8F0).withOpacity(0.5)),

                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                              child: Row(
                                children: [
                                  Icon(Icons.calendar_today_outlined, size: 13, color: accent.withOpacity(0.6)),
                                  const SizedBox(width: 5),
                                  Text('${_fmtDate(event.startTime)}  ${_fmtTime(event.startTime)}',
                                      style: const TextStyle(fontSize: 12.5, color: Color(0xFF64748B), fontWeight: FontWeight.w500)),
                                  const Spacer(),
                                  if (!isUpcoming)
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(10), border: Border.all(color: const Color(0xFFE2E8F0))),
                                      child: const Text('Đã kết thúc', style: TextStyle(fontSize: 10.5, color: Color(0xFF94A3B8), fontWeight: FontWeight.w600)),
                                    ),
                                ],
                              ),
                            ),

                            Padding(
                              padding: const EdgeInsets.fromLTRB(12, 0, 12, 14),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: ElevatedButton.icon(
                                      onPressed: () => _showQR(event),
                                      icon: const Icon(Icons.qr_code_2_rounded, size: 17),
                                      label: const Text('Xem QR', style: TextStyle(fontSize: 13)),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: accent,
                                        padding: const EdgeInsets.symmetric(vertical: 11),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(11)),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Expanded(
                                    child: OutlinedButton.icon(
                                      onPressed: () => _cancel(event),
                                      icon: const Icon(Icons.close_rounded, size: 15),
                                      label: const Text('Huỷ', style: TextStyle(fontSize: 13)),
                                      style: OutlinedButton.styleFrom(
                                        foregroundColor: const Color(0xFFEF4444),
                                        side: const BorderSide(color: Color(0xFFFECACA)),
                                        padding: const EdgeInsets.symmetric(vertical: 11),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(11)),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                    childCount: svc.myEvents.length,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}