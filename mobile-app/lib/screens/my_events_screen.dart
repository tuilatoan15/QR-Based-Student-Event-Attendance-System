import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/event_service.dart';
import '../widgets/event_card.dart';

class MyEventsScreen extends StatefulWidget {
  const MyEventsScreen({super.key});

  static const String routeName = '/my-events';

  @override
  State<MyEventsScreen> createState() => _MyEventsScreenState();
}

class _MyEventsScreenState extends State<MyEventsScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => context.read<EventService>().fetchMyEvents());
  }

  @override
  Widget build(BuildContext context) {
    final eventService = context.watch<EventService>();

    return Scaffold(
      appBar: AppBar(title: const Text('My Events')),
      body: RefreshIndicator(
        onRefresh: () => eventService.fetchMyEvents(),
        child: Builder(
          builder: (context) {
            if (eventService.isLoading && eventService.myEvents.isEmpty) {
              return const Center(child: CircularProgressIndicator());
            }

            if (eventService.errorMessage != null && eventService.myEvents.isEmpty) {
              return Center(child: Text(eventService.errorMessage!));
            }

            if (eventService.myEvents.isEmpty) {
              return const Center(child: Text('You have not registered for any events.'));
            }

            return ListView.builder(
              itemCount: eventService.myEvents.length,
              itemBuilder: (context, index) {
                final event = eventService.myEvents[index];
                return EventCard(event: event);
              },
            );
          },
        ),
      ),
    );
  }
}

