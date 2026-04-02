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
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        titlePadding: const EdgeInsets.fromLTRB(24, 24, 24, 8),
        contentPadding: const EdgeInsets.fromLTRB(24, 0, 24, 8),
        actionsPadding: const EdgeInsets.fromLTRB(16, 8, 16, 18),
        title: const Text('Huỷ đăng ký', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 20)),
        content: Text('Bạn có chắc muốn huỷ đăng ký "${event.title}"?', style: const TextStyle(color: Color(0xFF64748B))),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Không')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
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

  Color _accentFor(String id) {
    final colors = [const Color(0xFF2563EB), const Color(0xFF7C3AED), const Color(0xFF0891B2), const Color(0xFF059669), const Color(0xFFEA580C)];
    return colors[id.hashCode % colors.length];
  }

  @override
  Widget build(BuildContext context) {
    final svc = context.watch<EventService>();

    return Scaffold(
      backgroundColor: const Color(0xFFDCEBFF),
      body: RefreshIndicator(
        color: const Color(0xFF2563EB),
        onRefresh: () => svc.fetchMyEvents(),
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              pinned: true,
              expandedHeight: 140,
              backgroundColor: const Color(0xFF2563EB),
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
                      colors: [Color(0xFF2563EB), Color(0xFF0EA5E9)],
                    ),
                  ),
                  child: SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 40, 20, 20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          const Text('Sự kiện của tôi', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800, letterSpacing: -0.4)),
                          const SizedBox(height: 4),
                          Text(
                            '${svc.myEvents.length} sự kiện đã đăng ký',
                            style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 13.5),
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
                          padding: const EdgeInsets.all(24),
                          decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                          child: const Icon(Icons.bookmark_border_rounded, size: 48, color: Color(0xFF2563EB)),
                        ),
                        const SizedBox(height: 20),
                        const Text('Chưa có sự kiện nào', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF0F172A))),
                        const SizedBox(height: 8),
                        const Text('Hãy khám phá các sự kiện mới nhất và đăng ký tham gia ngay nhé!', style: TextStyle(fontSize: 14, color: Color(0xFF64748B), height: 1.4), textAlign: TextAlign.center),
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
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [BoxShadow(color: accent.withOpacity(0.12), blurRadius: 20, offset: const Offset(0, 8))],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(colors: [accent.withOpacity(0.1), accent.withOpacity(0.01)], begin: Alignment.topLeft, end: Alignment.bottomRight),
                                borderRadius: const BorderRadius.only(topLeft: Radius.circular(20), topRight: Radius.circular(20)),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Container(
                                    width: 48,
                                    height: 48,
                                    decoration: BoxDecoration(
                                      gradient: LinearGradient(colors: [accent, accent.withOpacity(0.8)]),
                                      borderRadius: BorderRadius.circular(14),
                                    ),
                                    child: const Icon(Icons.event_note_rounded, color: Colors.white, size: 24),
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(event.title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: Color(0xFF0F172A), height: 1.3), maxLines: 2, overflow: TextOverflow.ellipsis),
                                        const SizedBox(height: 6),
                                        Row(
                                          children: [
                                            Icon(Icons.location_on_rounded, size: 14, color: accent),
                                            const SizedBox(width: 4),
                                            Expanded(child: Text(event.location, style: TextStyle(fontSize: 12.5, color: accent.withOpacity(0.9), fontWeight: FontWeight.w500), maxLines: 1, overflow: TextOverflow.ellipsis)),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                              child: Row(
                                children: [
                                  Icon(Icons.calendar_today_rounded, size: 14, color: accent.withOpacity(0.6)),
                                  const SizedBox(width: 6),
                                  Text('${_fmtDate(event.startTime)} • ${_fmtTime(event.startTime)}',
                                      style: const TextStyle(fontSize: 13, color: Color(0xFF64748B), fontWeight: FontWeight.w600)),
                                  const Spacer(),
                                  if (!isUpcoming)
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                      decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(12), border: Border.all(color: const Color(0xFFE2E8F0))),
                                      child: const Text('Đã kết thúc', style: TextStyle(fontSize: 11, color: Color(0xFF64748B), fontWeight: FontWeight.w700)),
                                    ),
                                ],
                              ),
                            ),

                            Padding(
                              padding: const EdgeInsets.fromLTRB(16, 0, 16, 18),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: ElevatedButton.icon(
                                      onPressed: () => _showQR(event),
                                      icon: const Icon(Icons.qr_code_scanner_rounded, size: 18),
                                      label: const Text('Mã QR', style: TextStyle(fontWeight: FontWeight.w700)),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: accent,
                                        foregroundColor: Colors.white,
                                        padding: const EdgeInsets.symmetric(vertical: 14),
                                        elevation: 0,
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: OutlinedButton.icon(
                                      onPressed: () => _cancel(event),
                                      icon: const Icon(Icons.cancel_outlined, size: 18),
                                      label: const Text('Huỷ vé', style: TextStyle(fontWeight: FontWeight.w700)),
                                      style: OutlinedButton.styleFrom(
                                        foregroundColor: const Color(0xFFEF4444),
                                        side: const BorderSide(color: Color(0xFFFCA5A5)),
                                        padding: const EdgeInsets.symmetric(vertical: 14),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
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
              )
          ],
        ),
      ),
    );
  }
}