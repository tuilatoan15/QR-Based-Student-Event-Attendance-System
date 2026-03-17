import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../services/organizer_service.dart';
import '../../services/auth_service.dart';
import '../../models/event.dart';
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

  @override
  Widget build(BuildContext context) {
    final organizerService = context.watch<OrganizerService>();
    final auth = context.read<AuthService>();
    const accent = Color(0xFF6C63FF);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F5FF),
      body: RefreshIndicator(
        onRefresh: () => context.read<OrganizerService>().fetchMyEvents(),
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              expandedHeight: 180,
              pinned: true,
              backgroundColor: accent,
              automaticallyImplyLeading: false,
              actions: [
                IconButton(
                  icon: const Icon(Icons.logout_rounded, color: Colors.white),
                  onPressed: () async {
                    await auth.logout();
                    if (context.mounted) {
                      Navigator.of(context).pushNamedAndRemoveUntil('/', (_) => false);
                    }
                  },
                ),
              ],
              flexibleSpace: FlexibleSpaceBar(
                background: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFF6C63FF), Color(0xFF4A90D9)],
                    ),
                  ),
                  padding: const EdgeInsets.fromLTRB(24, 80, 24, 20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Text(
                        'Xin chào, ${auth.currentUser?.fullName ?? 'Organizer'} 👋',
                        style: const TextStyle(color: Colors.white70, fontSize: 14),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Organizer Dashboard',
                        style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ─── Stats Cards ───────────────────────────────────
                    Row(
                      children: [
                        _StatCard(
                          label: 'Tổng sự kiện',
                          value: '${organizerService.totalEvents}',
                          icon: Icons.event_rounded,
                          color: const Color(0xFF6C63FF),
                        ),
                        const SizedBox(width: 12),
                        _StatCard(
                          label: 'Sắp diễn ra',
                          value: '${organizerService.upcomingEvents}',
                          icon: Icons.upcoming_rounded,
                          color: const Color(0xFF00BCD4),
                        ),
                        const SizedBox(width: 12),
                        _StatCard(
                          label: 'Đăng ký',
                          value: '${organizerService.totalRegistered}',
                          icon: Icons.people_rounded,
                          color: const Color(0xFF4CAF50),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // ─── Upcoming Events ────────────────────────────────
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Sự kiện sắp tới', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Color(0xFF1A1A2E))),
                        TextButton(
                          onPressed: () {},
                          child: const Text('Xem tất cả', style: TextStyle(color: Color(0xFF6C63FF))),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    if (organizerService.isLoading)
                      const Center(child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator()))
                    else if (organizerService.myEvents.isEmpty)
                      _EmptyState(
                        icon: Icons.event_note_outlined,
                        message: 'Chưa có sự kiện nào.\nTạo sự kiện đầu tiên của bạn!',
                        actionLabel: 'Tạo sự kiện',
                        onAction: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const OrganizerEventFormScreen())),
                      )
                    else
                      ...organizerService.myEvents
                          .where((e) => e.startTime.isAfter(DateTime.now()))
                          .take(5)
                          .map((e) => _UpcomingEventTile(event: e)),
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

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value, required this.icon, required this.color});
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(10)),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 10),
            Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: color)),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(fontSize: 11, color: Color(0xFF9E9E9E)), maxLines: 1, overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }
}

class _UpcomingEventTile extends StatelessWidget {
  const _UpcomingEventTile({required this.event});
  final Event event;

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('dd/MM/yyyy HH:mm');
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFF6C63FF), Color(0xFF4A90D9)]),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.event_rounded, color: Colors.white, size: 24),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(event.title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: Color(0xFF1A1A2E)), maxLines: 1, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.access_time_rounded, size: 12, color: Color(0xFF9E9E9E)),
                    const SizedBox(width: 4),
                    Text(dateFormat.format(event.startTime), style: const TextStyle(fontSize: 12, color: Color(0xFF9E9E9E))),
                  ],
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined, size: 12, color: Color(0xFF9E9E9E)),
                    const SizedBox(width: 4),
                    Expanded(child: Text(event.location, style: const TextStyle(fontSize: 12, color: Color(0xFF9E9E9E)), maxLines: 1, overflow: TextOverflow.ellipsis)),
                  ],
                ),
              ],
            ),
          ),
          if (event.registeredCount != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(color: const Color(0xFF6C63FF).withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
              child: Text('${event.registeredCount}/${event.maxParticipants}', style: const TextStyle(fontSize: 11, color: Color(0xFF6C63FF), fontWeight: FontWeight.w600)),
            ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.icon, required this.message, this.actionLabel, this.onAction});
  final IconData icon;
  final String message;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 32),
        child: Column(
          children: [
            Icon(icon, size: 56, color: const Color(0xFFCFCFCF)),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center, style: const TextStyle(fontSize: 14, color: Color(0xFF9E9E9E))),
            if (actionLabel != null && onAction != null) ...[
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: onAction,
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF6C63FF)),
                child: Text(actionLabel!),
              ),
            ]
          ],
        ),
      ),
    );
  }
}
