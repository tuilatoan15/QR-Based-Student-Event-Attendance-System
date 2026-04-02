import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/auth_service.dart';
import '../services/event_service.dart';
import '../services/notification_service.dart';
import '../utils/string_utils.dart';
import '../widgets/event_card.dart';
import 'event_detail_screen.dart';
import 'my_events_screen.dart';
import 'notifications_screen.dart';
import 'profile_screen.dart';

class EventListScreen extends StatefulWidget {
  const EventListScreen({super.key});

  static const String routeName = '/events';

  @override
  State<EventListScreen> createState() => _EventListScreenState();
}

class _EventListScreenState extends State<EventListScreen> {
  int _currentIndex = 0;

  final List<Widget> _pages = const [
    _EventListBody(),
    MyEventsScreen(),
    NotificationsScreen(),
    ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<EventService>().fetchEvents();
    });
  }

  @override
  Widget build(BuildContext context) {
    const accent = Color(0xFF00CCFF);

    return Scaffold(
      backgroundColor: const Color(0xFFF0F4FF),
      body: IndexedStack(
        index: _currentIndex,
        children: _pages,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 10,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) {
            setState(() => _currentIndex = index);
            if (index == 0) context.read<EventService>().fetchEvents();
            if (index == 1) context.read<EventService>().fetchMyEvents();
            if (index == 2) {
              context.read<NotificationService>().fetchNotifications();
            }
          },
          type: BottomNavigationBarType.fixed,
          backgroundColor: Colors.white,
          selectedItemColor: accent,
          unselectedItemColor: const Color(0xFF94A3B8),
          selectedLabelStyle:
              const TextStyle(fontWeight: FontWeight.w700, fontSize: 11),
          unselectedLabelStyle:
              const TextStyle(fontWeight: FontWeight.w500, fontSize: 11),
          elevation: 0,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.explore_outlined),
              activeIcon: Icon(Icons.explore_rounded),
              label: 'Khám phá',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.bookmark_border_rounded),
              activeIcon: Icon(Icons.bookmark_rounded),
              label: 'Của tôi',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.notifications_none_rounded),
              activeIcon: Icon(Icons.notifications_rounded),
              label: 'Thông báo',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline_rounded),
              activeIcon: Icon(Icons.person_rounded),
              label: 'Tôi',
            ),
          ],
        ),
      ),
    );
  }
}

class _EventListBody extends StatefulWidget {
  const _EventListBody();

  @override
  State<_EventListBody> createState() => _EventListBodyState();
}

enum _EventListFilter {
  all,
  ongoing,
  upcoming,
}

class _EventListBodyState extends State<_EventListBody> {
  final _searchController = TextEditingController();
  String _query = '';
  _EventListFilter _activeFilter = _EventListFilter.all;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final eventService = context.watch<EventService>();
    final auth = context.watch<AuthService>();
    final userName = auth.currentUser?.fullName?.split(' ').last ?? 'bạn';
    const accent = Color(0xFF00CCFF);
    final now = DateTime.now();

    final searchedEvents = eventService.events.where((event) {
      if (_query.isEmpty) return true;
      final q = removeDiacritics(_query).toLowerCase();
      return removeDiacritics(event.title).toLowerCase().contains(q) ||
          removeDiacritics(event.location).toLowerCase().contains(q);
    }).toList();

    final allCount = searchedEvents.length;
    final ongoingCount = searchedEvents
        .where((event) => event.startTime.isBefore(now) && event.endTime.isAfter(now))
        .length;
    final upcomingCount =
        searchedEvents.where((event) => event.startTime.isAfter(now)).length;

    final visibleEvents = searchedEvents.where((event) {
      switch (_activeFilter) {
        case _EventListFilter.all:
          return true;
        case _EventListFilter.ongoing:
          return event.startTime.isBefore(now) && event.endTime.isAfter(now);
        case _EventListFilter.upcoming:
          return event.startTime.isAfter(now);
      }
    }).toList()
      ..sort((a, b) => a.startTime.compareTo(b.startTime));

    return RefreshIndicator(
      color: accent,
      onRefresh: () => eventService.fetchEvents(),
      child: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    Color(0xFF00CCFF),
                    Color(0xFF00B4D8),
                    Color(0xFF0EA5E9),
                  ],
                ),
              ),
              child: SafeArea(
                bottom: false,
                child: Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 16, 16, 0),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Xin chào, $userName',
                                  style: const TextStyle(
                                    color: Colors.white70,
                                    fontSize: 13.5,
                                    fontWeight: FontWeight.w400,
                                  ),
                                ),
                                const SizedBox(height: 3),
                                const Text(
                                  'Khám phá sự kiện',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 22,
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: -0.5,
                                  ),
                                ),
                              ],
                            ),
                          ),

                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.08),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: TextField(
                          controller: _searchController,
                          onChanged: (value) => setState(() => _query = value),
                          style: const TextStyle(
                            fontSize: 14,
                            color: Color(0xFF0F172A),
                          ),
                          decoration: InputDecoration(
                            hintText: 'Tìm kiếm sự kiện...',
                            hintStyle: const TextStyle(
                              color: Color(0xFFCBD5E1),
                              fontSize: 14,
                            ),
                            prefixIcon: const Icon(
                              Icons.search_rounded,
                              color: Color(0xFF94A3B8),
                              size: 20,
                            ),
                            suffixIcon: _query.isNotEmpty
                                ? IconButton(
                                    icon: const Icon(
                                      Icons.close_rounded,
                                      size: 18,
                                      color: Color(0xFF94A3B8),
                                    ),
                                    onPressed: () {
                                      _searchController.clear();
                                      setState(() => _query = '');
                                    },
                                  )
                                : null,
                            border: InputBorder.none,
                            enabledBorder: InputBorder.none,
                            focusedBorder: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 14,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 4),
              child: Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  _StatPill(
                    label: '$allCount sự kiện',
                    icon: Icons.event_rounded,
                    color: accent,
                    isActive: _activeFilter == _EventListFilter.all,
                    onTap: () {
                      setState(() => _activeFilter = _EventListFilter.all);
                    },
                  ),
                  _StatPill(
                    label: '$ongoingCount đang diễn ra',
                    icon: Icons.play_circle_outline_rounded,
                    color: const Color(0xFF10B981),
                    isActive: _activeFilter == _EventListFilter.ongoing,
                    onTap: () {
                      setState(
                        () => _activeFilter = _EventListFilter.ongoing,
                      );
                    },
                  ),
                  _StatPill(
                    label: '$upcomingCount sắp tới',
                    icon: Icons.upcoming_rounded,
                    color: const Color(0xFF0EA5E9),
                    isActive: _activeFilter == _EventListFilter.upcoming,
                    onTap: () {
                      setState(
                        () => _activeFilter = _EventListFilter.upcoming,
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
          if (eventService.isLoading && eventService.events.isEmpty)
            const SliverFillRemaining(
              child: Center(
                child: CircularProgressIndicator(color: accent),
              ),
            )
          else if (eventService.errorMessage != null &&
              eventService.events.isEmpty)
            SliverFillRemaining(
              child: _EmptyState(
                icon: Icons.wifi_off_rounded,
                title: 'Không thể tải dữ liệu',
                subtitle: eventService.errorMessage!,
                actionLabel: 'Thử lại',
                onAction: () => eventService.fetchEvents(),
              ),
            )
          else if (visibleEvents.isEmpty)
            SliverFillRemaining(
              child: _EmptyState(
                icon: Icons.search_off_rounded,
                title: 'Không tìm thấy sự kiện',
                subtitle: _query.isNotEmpty
                    ? 'Thử tìm kiếm với từ khóa khác'
                    : _activeFilter == _EventListFilter.ongoing
                        ? 'Không có sự kiện nào đang diễn ra'
                        : _activeFilter == _EventListFilter.upcoming
                            ? 'Không có sự kiện sắp tới'
                            : 'Chưa có sự kiện nào',
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final event = visibleEvents[index];
                    return EventCard(
                      key: ValueKey(event.id),
                      event: event,
                      onTap: () {
                        Navigator.of(context).pushNamed(
                          EventDetailScreen.routeName,
                          arguments: event.id,
                        );
                      },
                    );
                  },
                  childCount: visibleEvents.length,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _HeaderIconBtn extends StatelessWidget {
  const _HeaderIconBtn({
    required this.icon,
    required this.onTap,
    this.badge = false,
    this.tooltip,
  });

  final IconData icon;
  final VoidCallback onTap;
  final bool badge;
  final String? tooltip;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip ?? '',
      child: GestureDetector(
        onTap: onTap,
        child: Stack(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.white.withOpacity(0.25)),
              ),
              child: Icon(icon, color: Colors.white, size: 20),
            ),
            if (badge)
              Positioned(
                right: 6,
                top: 6,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: Color(0xFFFBBF24),
                    shape: BoxShape.circle,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _StatPill extends StatelessWidget {
  const _StatPill({
    required this.label,
    required this.icon,
    required this.onTap,
    this.color = const Color(0xFF2563EB),
    this.isActive = false,
  });

  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  final bool isActive;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: isActive ? color.withOpacity(0.18) : color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isActive ? color.withOpacity(0.45) : color.withOpacity(0.15),
            width: isActive ? 1.4 : 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: color),
            const SizedBox(width: 5),
            Text(
              label,
              style: TextStyle(
                fontSize: 12.5,
                color: color,
                fontWeight: isActive ? FontWeight.w700 : FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                color: Color(0xFFEFF6FF),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 40, color: const Color(0xFF2563EB)),
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              subtitle,
              style: const TextStyle(
                fontSize: 13.5,
                color: Color(0xFF94A3B8),
              ),
              textAlign: TextAlign.center,
            ),
            if (actionLabel != null) ...[
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: onAction,
                child: Text(actionLabel!),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
