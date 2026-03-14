import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import 'services/auth_service.dart';
import 'services/event_service.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/event_list_screen.dart';
import 'screens/event_detail_screen.dart';
import 'screens/my_events_screen.dart';
import 'screens/qr_screen.dart';
import 'screens/notifications_screen.dart';
import 'screens/profile_screen.dart';
import 'services/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );
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
        title: 'EventPass',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF00CCFF),
            brightness: Brightness.light,
          ).copyWith(
            primary: const Color(0xFF00CCFF),
            secondary: const Color(0xFF00B4D8),
            surface: const Color(0xFFF8FAFF),
            error: const Color(0xFFEF4444),
          ),
          fontFamily: 'Roboto',
          scaffoldBackgroundColor: const Color(0xFFF0F4FF),
          appBarTheme: const AppBarTheme(
            backgroundColor: Colors.white,
            foregroundColor: Color(0xFF0F172A),
            elevation: 0,
            scrolledUnderElevation: 0,
            titleTextStyle: TextStyle(
              color: Color(0xFF0F172A),
              fontSize: 17,
              fontWeight: FontWeight.w700,
              letterSpacing: -0.3,
            ),
            iconTheme: IconThemeData(color: Color(0xFF00CCFF)),
          ),
          cardTheme: CardTheme(
            elevation: 0,
            color: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            margin: EdgeInsets.zero,
          ),
          inputDecorationTheme: InputDecorationTheme(
            filled: true,
            fillColor: const Color(0xFFF8FAFF),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0), width: 1.5),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0), width: 1.5),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF00CCFF), width: 2),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFFEF4444), width: 1.5),
            ),
            labelStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 14),
            hintStyle: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 14),
          ),
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF00CCFF),
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              textStyle: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.2,
              ),
            ),
          ),
          snackBarTheme: SnackBarThemeData(
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            contentTextStyle: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w500),
          ),
        ),
        home: const _AppRouter(),
        routes: {
          LoginScreen.routeName: (context) => const LoginScreen(),
          RegisterScreen.routeName: (context) => const RegisterScreen(),
          EventListScreen.routeName: (context) => const EventListScreen(),
          EventDetailScreen.routeName: (context) => const EventDetailScreen(),
          MyEventsScreen.routeName: (context) => const MyEventsScreen(),
          QRScreen.routeName: (context) => const QRScreen(),
          NotificationsScreen.routeName: (context) => const NotificationsScreen(),
          ProfileScreen.routeName: (context) => const ProfileScreen(),
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
        if (authService.currentUser == null && authService.isAuthenticated) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        if (!authService.isAuthenticated) return const LoginScreen();
        final role = authService.currentUser?.role.toLowerCase();
        if (role == 'student' || role == '3') return const EventListScreen();
        return const LoginScreen();
      },
    );
  }
}