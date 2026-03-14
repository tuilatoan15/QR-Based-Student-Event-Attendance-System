import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/auth_service.dart';
import '../services/event_service.dart';
import '../widgets/event_card.dart';
import 'event_detail_screen.dart';
import 'login_screen.dart';
import 'my_events_screen.dart';
import 'profile_screen.dart';
import 'notifications_screen.dart';
import '../services/notification_service.dart';

class EventListScreen extends StatefulWidget {
  const EventListScreen({super.key});

  static const String routeName = '/events';

  @override
  State<EventListScreen> createState() => _EventListScreenState();
}

class _EventListScreenState extends State<EventListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<EventService>().fetchEvents();
      context.read<NotificationService>().fetchNotifications();
    });
  }

  @override
  Widget build(BuildContext context) {
    final eventService = context.watch<EventService>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Events'),
        actions: [
          IconButton(
            icon: const Icon(Icons.event_available),
            onPressed: () {
              Navigator.of(context).pushNamed(MyEventsScreen.routeName);
            },
          ),
          Consumer<NotificationService>(
            builder: (context, notifService, _) {
              return Stack(
                alignment: Alignment.center,
                children: [
                  IconButton(
                    icon: const Icon(Icons.notifications),
                    onPressed: () {
                      Navigator.of(context).pushNamed(NotificationsScreen.routeName);
                    },
                  ),
                  if (notifService.unreadCount > 0)
                    Positioned(
                      right: 8,
                      top: 8,
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: BoxDecoration(
                          color: Colors.red,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        constraints: const BoxConstraints(
                          minWidth: 16,
                          minHeight: 16,
                        ),
                        child: Text(
                          '${notifService.unreadCount}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.person),
            onPressed: () {
              Navigator.of(context).pushNamed(ProfileScreen.routeName);
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await context.read<AuthService>().logout();
              if (!mounted) return;
              Navigator.of(context).pushReplacementNamed(LoginScreen.routeName);
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => eventService.fetchEvents(),
        child: Builder(
          builder: (context) {
            if (eventService.isLoading && eventService.events.isEmpty) {
              return const Center(child: CircularProgressIndicator());
            }

            if (eventService.errorMessage != null &&
                eventService.events.isEmpty) {
              return Center(child: Text(eventService.errorMessage!));
            }

            if (eventService.events.isEmpty) {
              return const Center(child: Text('No events available.'));
            }

            return ListView.builder(
              itemCount: eventService.events.length,
              itemBuilder: (context, index) {
                final event = eventService.events[index];
                return EventCard(
                  event: event,
                  onTap: () {
                    Navigator.of(context).pushNamed(
                      EventDetailScreen.routeName,
                      arguments: event.id,
                    );
                  },
                );
              },
            );
          },
        ),
      ),
    );
  }
}
