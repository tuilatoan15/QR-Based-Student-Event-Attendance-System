import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../services/organizer_service.dart';
import '../../services/auth_service.dart';
import '../../services/event_service.dart';
import '../../services/notification_service.dart';
import '../../models/event.dart';
import '../event_detail_screen.dart';
import 'organizer_shell.dart';
import 'organizer_profile_screen.dart';
import 'organizer_event_form_screen.dart';

class OrganizerDashboardScreen extends StatefulWidget {
  const OrganizerDashboardScreen({super.key});

  @override
  State<OrganizerDashboardScreen> createState() => _OrganizerDashboardScreenState();
}

class _OrganizerDashboardScreenState extends State<OrganizerDashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<OrganizerService>().fetchMyEvents();
    });
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

  @override
  Widget build(BuildContext context) {
    final svc = context.watch<OrganizerService>();
    final auth = context.read<AuthService>();
    final dateFormat = DateFormat('dd/MM/yy HH:mm');
    const accent = Color(0xFF6C63FF);

    final recentEvents = [...svc.myEvents]
      ..sort((a, b) => b.startTime.compareTo(a.startTime));
    final displayEvents = recentEvents.take(8).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFF),
      body: RefreshIndicator(
        color: accent,
        onRefresh: () => context.read<OrganizerService>().fetchMyEvents(),
        child: CustomScrollView(
          slivers: [
            // ─── Header ──────────────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF6C63FF), Color(0xFF4A90D9)],
                  ),
                ),
                padding: EdgeInsets.fromLTRB(20, MediaQuery.of(context).padding.top + 16, 20, 28),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Xin chào, ${auth.currentUser?.fullName ?? 'Organizer'} 👋',
                            style: const TextStyle(color: Colors.white70, fontSize: 13),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Tổng quan',
                            style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w800, letterSpacing: -0.5),
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'Tổng quan sự kiện và điểm danh',
                            style: TextStyle(color: Colors.white60, fontSize: 12.5),
                          ),
                        ],
                      ),
                    ),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          onPressed: () {
                            Navigator.of(context).pushNamed(OrganizerProfileScreen.routeName);
                          },
                          icon: const Icon(Icons.account_circle_rounded, color: Colors.white70, size: 26),
                          tooltip: 'Hồ sơ',
                        ),
                        IconButton(
                          onPressed: () async {
                            // Clear all data
                            if (context.mounted) {
                              context.read<EventService>().clearData();
                              context.read<NotificationService>().clearData();
                              context.read<OrganizerService>().clearData();
                            }
                            
                            await context.read<AuthService>().logout();
                            
                            if (context.mounted) {
                              Navigator.of(context).pushNamedAndRemoveUntil('/', (route) => false);
                            }
                          },
                          icon: const Icon(Icons.logout_rounded, color: Colors.white70, size: 24),
                          tooltip: 'Đăng xuất',
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // ─── Stats Cards ─────────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
                child: Row(
                  children: [
                    _StatCard(
                      label: 'Tổng', 
                      value: '${svc.totalEvents}', 
                      icon: Icons.event_rounded, 
                      color: const Color(0xFF6C63FF),
                      onTap: () => OrganizerShell.of(context).changeTab(1),
                    ),
                    const SizedBox(width: 8),
                    _StatCard(
                      label: 'Sắp tới', 
                      value: '${svc.upcomingEvents}', 
                      icon: Icons.upcoming_rounded, 
                      color: const Color(0xFF0284C7),
                      onTap: () => OrganizerShell.of(context).changeTab(1),
                    ),
                    const SizedBox(width: 8),
                    _StatCard(
                      label: 'Đăng ký', 
                      value: '${svc.totalRegistered}', 
                      icon: Icons.people_rounded, 
                      color: const Color(0xFF16A34A),
                      onTap: () => OrganizerShell.of(context).changeTab(3),
                    ),
                    const SizedBox(width: 8),
                    _StatCard(
                      label: 'Check-in', 
                      value: '${svc.totalCheckedIn}', 
                      icon: Icons.how_to_reg_rounded, 
                      color: const Color(0xFF9333EA),
                      onTap: () => OrganizerShell.of(context).changeTab(3),
                    ),
                  ],
                ),
              ),
            ),

            // ─── Recent Events Table ──────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Section header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Sự kiện gần đây', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
                        TextButton(
                          onPressed: () => OrganizerShell.of(context).changeTab(1),
                          style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: Size.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap),
                          child: const Text('Xem tất cả', style: TextStyle(color: Color(0xFF6C63FF), fontSize: 12.5)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    if (svc.isLoading)
                      const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator()))
                    else if (displayEvents.isEmpty)
                      _EmptyEvents(
                        onCreateTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const OrganizerEventFormScreen())),
                      )
                    else
                      // Web-style card with table
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: const Color(0xFFE0EEFF)),
                          boxShadow: [
                            BoxShadow(color: const Color(0xFF6C63FF).withOpacity(0.05), blurRadius: 12, offset: const Offset(0, 4)),
                          ],
                        ),
                        child: Column(
                          children: [
                            // Table header
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                              decoration: const BoxDecoration(
                                color: Color(0xFFF8FBFF),
                                borderRadius: BorderRadius.vertical(top: Radius.circular(14)),
                              ),
                              child: const Row(
                                children: [
                                  Expanded(flex: 5, child: Text('SỰ KIỆN', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF94A3B8), letterSpacing: 0.6))),
                                  Expanded(flex: 3, child: Text('THỜI GIAN', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF94A3B8), letterSpacing: 0.6))),
                                  Expanded(flex: 2, child: Text('ĐK/CK', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF94A3B8), letterSpacing: 0.6), textAlign: TextAlign.center)),
                                  SizedBox(width: 70, child: Text('TRẠNG THÁI', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF94A3B8), letterSpacing: 0.6), textAlign: TextAlign.center)),
                                ],
                              ),
                            ),
                            const Divider(height: 1, color: Color(0xFFE0EEFF)),
                            // Table rows
                            ...displayEvents.asMap().entries.map((entry) {
                              final i = entry.key;
                              final e = entry.value;
                              final status = _eventStatus(e);
                              final statusColor = _statusColor(status);
                              return Column(
                                children: [
                                  InkWell(
                                    onTap: () => Navigator.of(context).pushNamed(EventDetailScreen.routeName, arguments: e.id),
                                    child: Container(
                                      color: i.isEven ? Colors.white : const Color(0xFFFAFBFF),
                                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
                                      child: Row(
                                        children: [
                                          Expanded(
                                            flex: 5,
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(e.title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Color(0xFF0F172A)), maxLines: 1, overflow: TextOverflow.ellipsis),
                                                const SizedBox(height: 2),
                                                Row(
                                                  children: [
                                                    const Icon(Icons.location_on_outlined, size: 11, color: Color(0xFF94A3B8)),
                                                    const SizedBox(width: 2),
                                                    Expanded(child: Text(e.location, style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)), maxLines: 1, overflow: TextOverflow.ellipsis)),
                                                  ],
                                                ),
                                              ],
                                            ),
                                          ),
                                          Expanded(
                                            flex: 3,
                                            child: Text(dateFormat.format(e.startTime), style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B))),
                                          ),
                                          Expanded(
                                            flex: 2,
                                            child: Text(
                                              '${e.registeredCount ?? 0}/${e.checkedInCount ?? 0}',
                                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF334155)),
                                              textAlign: TextAlign.center,
                                            ),
                                          ),
                                          SizedBox(
                                            width: 70,
                                            child: Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                              decoration: BoxDecoration(
                                                color: statusColor.withOpacity(0.1),
                                                borderRadius: BorderRadius.circular(20),
                                              ),
                                              child: Text(status, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: statusColor), textAlign: TextAlign.center),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                  if (i < displayEvents.length - 1)
                                    const Divider(height: 1, color: Color(0xFFF1F5F9)),
                                ],
                              );
                            }),
                            const SizedBox(height: 4),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Stat Card Widget ──────────────────────────────────────────────────────────

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value, required this.icon, required this.color, this.onTap});
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE0EEFF)),
            boxShadow: [
              BoxShadow(color: color.withOpacity(0.08), blurRadius: 10, offset: const Offset(0, 4)),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(9),
                ),
                child: Icon(icon, color: color, size: 16),
              ),
              const SizedBox(height: 10),
              Text(value, style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: color, letterSpacing: -0.5)),
              const SizedBox(height: 2),
              Text(label, style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8)), maxLines: 2, textAlign: TextAlign.center, overflow: TextOverflow.ellipsis),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Empty State ──────────────────────────────────────────────────────────────

class _EmptyEvents extends StatelessWidget {
  const _EmptyEvents({required this.onCreateTap});
  final VoidCallback onCreateTap;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE0EEFF)),
      ),
      child: Column(
        children: [
          const Icon(Icons.event_note_outlined, size: 48, color: Color(0xFFCBD5E1)),
          const SizedBox(height: 12),
          const Text('Chưa có sự kiện nào', style: TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF334155))),
          const SizedBox(height: 4),
          const Text('Tạo sự kiện đầu tiên để bắt đầu', style: TextStyle(fontSize: 12.5, color: Color(0xFF94A3B8))),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: onCreateTap,
            icon: const Icon(Icons.add_rounded, size: 16),
            label: const Text('Tạo sự kiện'),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6C63FF), foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10)),
          ),
        ],
      ),
    );
  }
}
