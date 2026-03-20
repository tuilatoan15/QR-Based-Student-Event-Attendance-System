import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import 'services/auth_service.dart';
import 'services/event_service.dart';
import 'services/organizer_service.dart';
import 'services/notification_service.dart';
import 'services/user_service.dart';
import 'screens/login_screen.dart';
import 'screens/register_screen.dart';
import 'screens/register_organizer_screen.dart';
import 'screens/event_list_screen.dart';
import 'screens/event_detail_screen.dart';
import 'screens/my_events_screen.dart';
import 'screens/qr_screen.dart';
import 'screens/notifications_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/organizer/organizer_shell.dart';
import 'screens/organizer/organizer_profile_screen.dart';
import 'services/theme_provider.dart';

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
        ChangeNotifierProvider<OrganizerService>(
          create: (_) => OrganizerService(),
        ),
        ChangeNotifierProvider<NotificationService>(
          create: (_) => NotificationService(),
        ),
        ChangeNotifierProvider<UserService>(
          create: (_) => UserService(),
        ),
        ChangeNotifierProvider<ThemeProvider>(
          create: (_) => ThemeProvider(),
        ),
      ],
      child: Consumer<ThemeProvider>(
        builder: (context, themeProvider, child) {
          return MaterialApp(
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
        themeMode: ThemeMode.light,
        darkTheme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF00CCFF),
            brightness: Brightness.dark,
          ).copyWith(
            primary: const Color(0xFF00CCFF),
            secondary: const Color(0xFF00B4D8),
            surface: const Color(0xFF0F172A),
            error: const Color(0xFFEF4444),
          ),
          fontFamily: 'Roboto',
          scaffoldBackgroundColor: const Color(0xFF1E293B),
          appBarTheme: const AppBarTheme(
            backgroundColor: Color(0xFF1E293B),
            foregroundColor: Colors.white,
            elevation: 0,
            scrolledUnderElevation: 0,
            titleTextStyle: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w700, letterSpacing: -0.3),
            iconTheme: IconThemeData(color: Color(0xFF00CCFF)),
          ),
          cardTheme: CardTheme(
            elevation: 0,
            color: const Color(0xFF334155),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            margin: EdgeInsets.zero,
          ),
          inputDecorationTheme: InputDecorationTheme(
            filled: true,
            fillColor: const Color(0xFF0F172A),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF475569), width: 1.5)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF475569), width: 1.5)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF00CCFF), width: 2)),
            errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFEF4444), width: 1.5)),
            labelStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
            hintStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 14),
          ),
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF00CCFF),
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, letterSpacing: 0.2),
            ),
          ),
          snackBarTheme: SnackBarThemeData(
            behavior: SnackBarBehavior.floating,
            backgroundColor: const Color(0xFF334155),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            contentTextStyle: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w500, color: Colors.white),
          ),
          bottomNavigationBarTheme: const BottomNavigationBarThemeData(
            backgroundColor: Color(0xFF1E293B),
            selectedItemColor: Color(0xFF00CCFF),
            unselectedItemColor: Color(0xFF64748B),
          ),
        ),
        home: const _AppRouter(),
        routes: {
          LoginScreen.routeName: (context) => const LoginScreen(),
          RegisterScreen.routeName: (context) => const RegisterScreen(),
          RegisterOrganizerScreen.routeName: (context) => const RegisterOrganizerScreen(),
          EventListScreen.routeName: (context) => const EventListScreen(),
          EventDetailScreen.routeName: (context) => const EventDetailScreen(),
          MyEventsScreen.routeName: (context) => const MyEventsScreen(),
          QRScreen.routeName: (context) => const QRScreen(),
          NotificationsScreen.routeName: (context) => const NotificationsScreen(),
          ProfileScreen.routeName: (context) => const ProfileScreen(),
          OrganizerShell.routeName: (context) => const OrganizerShell(),
          OrganizerProfileScreen.routeName: (context) => const OrganizerProfileScreen(),
        },
      );
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
        // Đang tải session
        if (authService.currentUser == null && authService.isAuthenticated) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }
        // Chưa đăng nhập
        if (!authService.isAuthenticated) return const LoginScreen();

        final role = authService.currentUser?.role.toLowerCase() ?? '';

        // Admin → thông báo dùng web
        if (role == 'admin' || role.contains('admin')) {
          return Scaffold(
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.admin_panel_settings_rounded, size: 72, color: Color(0xFF6C63FF)),
                    const SizedBox(height: 24),
                    const Text('Tài khoản Admin', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    const Text(
                      'Vui lòng sử dụng hệ thống\nWeb Admin để quản lý.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 15, color: Color(0xFF64748B)),
                    ),
                    const SizedBox(height: 32),
                    OutlinedButton.icon(
                      onPressed: () => authService.logout(),
                      icon: const Icon(Icons.logout_rounded),
                      label: const Text('Đăng xuất'),
                    ),
                  ],
                ),
              ),
            ),
          );
        }

        // Organizer → Organizer Shell
        if (role == 'organizer' || role == '2' || role.contains('organizer')) {
          return const OrganizerShell();
        }

        // Student (và các role khác) → Student UI
        return const EventListScreen();
      },
    );
  }
}

