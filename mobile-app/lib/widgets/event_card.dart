import 'package:flutter/material.dart';

import '../models/event.dart';

class EventCard extends StatelessWidget {
  const EventCard({
    super.key,
    required this.event,
    this.onTap,
  });

  final Event event;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: ListTile(
        title: Text(event.title),
        subtitle: Text(
          '${event.location}\n'
          '${event.startTime.toLocal()} - ${event.endTime.toLocal()}',
        ),
        isThreeLine: true,
        onTap: onTap,
      ),
    );
  }
}

