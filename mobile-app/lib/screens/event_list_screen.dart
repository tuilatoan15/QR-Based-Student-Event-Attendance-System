import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/auth_service.dart';
import '../services/event_service.dart';
import '../widgets/event_card.dart';
import 'event_detail_screen.dart';
import 'login_screen.dart';
import 'my_events_screen.dart';

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
