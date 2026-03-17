import 'package:flutter/material.dart';
import 'organizer_dashboard_screen.dart';
import 'organizer_events_screen.dart';
import 'organizer_participants_screen.dart';
import 'organizer_scan_screen.dart';

class OrganizerShell extends StatefulWidget {
  const OrganizerShell({super.key});
  static const String routeName = '/organizer';

  @override
  State<OrganizerShell> createState() => _OrganizerShellState();
}

class _OrganizerShellState extends State<OrganizerShell> {
  int _currentIndex = 0;

  final List<Widget> _pages = const [
    OrganizerDashboardScreen(),
    OrganizerEventsScreen(),
    OrganizerParticipantsScreen(),
    OrganizerScanScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    const accent = Color(0xFF6C63FF);
    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (i) => setState(() => _currentIndex = i),
        backgroundColor: Colors.white,
        indicatorColor: accent.withOpacity(0.12),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard_rounded, color: Color(0xFF6C63FF)),
            label: 'Dashboard',
          ),
          NavigationDestination(
            icon: Icon(Icons.event_outlined),
            selectedIcon: Icon(Icons.event_rounded, color: Color(0xFF6C63FF)),
            label: 'Sự kiện',
          ),
          NavigationDestination(
            icon: Icon(Icons.people_outlined),
            selectedIcon: Icon(Icons.people_rounded, color: Color(0xFF6C63FF)),
            label: 'Người tham gia',
          ),
          NavigationDestination(
            icon: Icon(Icons.qr_code_scanner_outlined),
            selectedIcon: Icon(Icons.qr_code_scanner_rounded, color: Color(0xFF6C63FF)),
            label: 'Scan QR',
          ),
        ],
      ),
    );
  }
}
