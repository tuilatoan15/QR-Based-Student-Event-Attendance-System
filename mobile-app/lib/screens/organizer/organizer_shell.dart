import 'package:flutter/material.dart';
import 'organizer_dashboard_screen.dart';
import 'organizer_events_screen.dart';
import 'organizer_attendance_screen.dart';
import 'organizer_scan_screen.dart';

class OrganizerShell extends StatefulWidget {
  const OrganizerShell({super.key});
  static const String routeName = '/organizer';

  static OrganizerShellState of(BuildContext context) {
    return context.findAncestorStateOfType<OrganizerShellState>()!;
  }

  @override
  State<OrganizerShell> createState() => OrganizerShellState();
}

class OrganizerShellState extends State<OrganizerShell> {
  int _currentIndex = 0;

  void changeTab(int index) {
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    const accent = Color(0xFF6C63FF);

    final List<Widget> pages = [
      const OrganizerDashboardScreen(),
      const OrganizerEventsScreen(),
      OrganizerScanScreen(isActive: _currentIndex == 2),
      const OrganizerAttendanceScreen(),
    ];

    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (i) => setState(() => _currentIndex = i),
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.white,
        indicatorColor: accent.withOpacity(0.12),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
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
            icon: Icon(Icons.qr_code_scanner_outlined),
            selectedIcon: Icon(Icons.qr_code_scanner_rounded, color: Color(0xFF6C63FF)),
            label: 'Scan QR',
          ),
          NavigationDestination(
            icon: Icon(Icons.fact_check_outlined),
            selectedIcon: Icon(Icons.fact_check_rounded, color: Color(0xFF6C63FF)),
            label: 'Điểm danh',
          ),
        ],
      ),
    );
  }
}
