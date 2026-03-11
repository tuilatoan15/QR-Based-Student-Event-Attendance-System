import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/auth_service.dart';
import '../services/event_service.dart';
import '../widgets/event_card.dart';
import 'create_event_screen.dart';
import 'event_participants_screen.dart';
import 'login_screen.dart';
import 'admin_scan_screen.dart';

class OrganizerDashboardScreen extends StatefulWidget {
  const OrganizerDashboardScreen({super.key});

  static const String routeName = '/organizer-dashboard';

  @override
  State<OrganizerDashboardScreen> createState() =>
      _OrganizerDashboardScreenState();
}

class _OrganizerDashboardScreenState extends State<OrganizerDashboardScreen> {
  @override
  void initState() {
    super.initState();
    // Delay the event loading until after the first frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadOrganizerEvents();
    });
  }

  Future<void> _loadOrganizerEvents() async {
    await context.read<EventService>().fetchOrganizerEvents();
  }

  Future<void> _logout() async {
    final authService = context.read<AuthService>();
    await authService.logout();
    if (mounted) {
      Navigator.of(context).pushReplacementNamed(LoginScreen.routeName);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Organizer Dashboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _logout,
          ),
        ],
      ),
      body: Consumer<EventService>(
        builder: (context, eventService, child) {
          if (eventService.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (eventService.errorMessage != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    eventService.errorMessage!,
                    style: const TextStyle(color: Colors.red),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _loadOrganizerEvents,
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: _loadOrganizerEvents,
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'My Events (${eventService.organizerEvents.length})',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      ElevatedButton.icon(
                        onPressed: () {
                          Navigator.of(context)
                              .pushNamed(CreateEventScreen.routeName);
                        },
                        icon: const Icon(Icons.add),
                        label: const Text('Create Event'),
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: eventService.organizerEvents.isEmpty
                      ? const Center(
                          child: Text(
                              'No events created yet. Create your first event!'),
                        )
                      : ListView.builder(
                          itemCount: eventService.organizerEvents.length,
                          itemBuilder: (context, index) {
                            final event = eventService.organizerEvents[index];
                            return EventCard(
                              event: event,
                              isOrganizer: true,
                              onTap: () {
                                Navigator.of(context).pushNamed(
                                  EventParticipantsScreen.routeName,
                                  arguments: event,
                                );
                              },
                              onEdit: () {
                                Navigator.of(context)
                                    .pushNamed(
                                      CreateEventScreen.routeName,
                                      arguments: event,
                                    )
                                    .then((_) => _loadOrganizerEvents());
                              },
                              onDelete: () async {
                                final confirmed = await showDialog<bool>(
                                  context: context,
                                  builder: (context) => AlertDialog(
                                    title: const Text('Delete Event'),
                                    content: Text(
                                        'Are you sure you want to delete "${event.title}"? This action cannot be undone.'),
                                    actions: [
                                      TextButton(
                                        onPressed: () =>
                                            Navigator.of(context).pop(false),
                                        child: const Text('Cancel'),
                                      ),
                                      TextButton(
                                        onPressed: () =>
                                            Navigator.of(context).pop(true),
                                        style: TextButton.styleFrom(
                                          foregroundColor: Theme.of(context)
                                              .colorScheme
                                              .error,
                                        ),
                                        child: const Text('Delete'),
                                      ),
                                    ],
                                  ),
                                );

                                if (confirmed == true) {
                                  try {
                                    await eventService.deleteEvent(event.id);
                                    await _loadOrganizerEvents();
                                    if (mounted) {
                                      ScaffoldMessenger.of(context)
                                          .showSnackBar(
                                        const SnackBar(
                                            content: Text(
                                                'Event deleted successfully')),
                                      );
                                    }
                                  } catch (e) {
                                    if (mounted) {
                                      ScaffoldMessenger.of(context)
                                          .showSnackBar(
                                        SnackBar(
                                            content: Text(
                                                'Failed to delete event: $e')),
                                      );
                                    }
                                  }
                                }
                              },
                              onViewRegistrations: () {
                                Navigator.of(context).pushNamed(
                                  EventParticipantsScreen.routeName,
                                  arguments: event,
                                );
                              },
                              onScanQr: () {
                                Navigator.of(context)
                                    .pushNamed(AdminScanScreen.routeName);
                              },
                            );
                          },
                        ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
