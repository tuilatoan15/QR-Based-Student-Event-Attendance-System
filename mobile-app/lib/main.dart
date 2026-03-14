import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

// import 'config/api_config.dart';
import 'services/auth_service.dart';
import 'services/event_service.dart';
import 'services/notification_service.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/event_list_screen.dart';
import 'screens/event_detail_screen.dart';
import 'screens/my_events_screen.dart';
import 'screens/qr_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/notifications_screen.dart';
// Admin/organizer features are now handled in the web dashboard only.

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
        ChangeNotifierProvider<NotificationService>(
          create: (_) => NotificationService(),
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
          ProfileScreen.routeName: (context) => const ProfileScreen(),
          NotificationsScreen.routeName: (context) => const NotificationsScreen(),
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

        // Only students are allowed to use the mobile application
        final role = authService.currentUser?.role.toLowerCase();
        if (role == 'student' || role == '3') {
          return const EventListScreen();
        }

        // Any non-student user is treated as unauthenticated for mobile app
        return const LoginScreen();
      },
    );
  }
}
