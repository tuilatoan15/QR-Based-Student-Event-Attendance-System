import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

// import 'config/api_config.dart';
import 'services/auth_service.dart';
import 'services/event_service.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/event_list_screen.dart';
import 'screens/event_detail_screen.dart';
import 'screens/my_events_screen.dart';
import 'screens/qr_screen.dart';
import 'screens/admin_scan_screen.dart';
import 'screens/organizer_dashboard_screen.dart';
import 'screens/create_event_screen.dart';
import 'screens/event_participants_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const SmartEventAttendanceApp());
}

class SmartEventAttendanceApp extends StatelessWidget {
  const SmartEventAttendanceApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthService>(
          create: (_) => AuthService()..loadToken(),
        ),
        ChangeNotifierProvider<EventService>(
          create: (_) => EventService(),
        ),
      ],
      child: MaterialApp(
        title: 'Smart Event Attendance',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.indigo),
          useMaterial3: true,
        ),
        home: const _AppRouter(),
        routes: {
          LoginScreen.routeName: (context) => const LoginScreen(),
          RegisterScreen.routeName: (context) => const RegisterScreen(),
          EventListScreen.routeName: (context) => const EventListScreen(),
          EventDetailScreen.routeName: (context) => const EventDetailScreen(),
          MyEventsScreen.routeName: (context) => const MyEventsScreen(),
          QRScreen.routeName: (context) => const QRScreen(),
          AdminScanScreen.routeName: (context) => const AdminScanScreen(),
          OrganizerDashboardScreen.routeName: (context) =>
              const OrganizerDashboardScreen(),
          CreateEventScreen.routeName: (context) => const CreateEventScreen(),
          EventParticipantsScreen.routeName: (context) =>
              const EventParticipantsScreen(),
        },
      ),
    );
  }
}

class _AppRouter extends StatelessWidget {
  const _AppRouter();

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthService>(
      builder: (context, authService, _) {
        // Show loading while checking auth status
        if (authService.currentUser == null && authService.isAuthenticated) {
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(),
            ),
          );
        }

        // Check authentication and redirect accordingly
        if (!authService.isAuthenticated) {
          return const LoginScreen();
        }

        // Route based on user role
        if (authService.currentUser?.role == 'organizer') {
          return const OrganizerDashboardScreen();
        }

        return const EventListScreen();
      },
    );
  }
}
