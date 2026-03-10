import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/event.dart';
import '../services/event_service.dart';
import 'admin_scan_screen.dart';

class EventParticipantsScreen extends StatefulWidget {
  const EventParticipantsScreen({super.key});

  static const String routeName = '/event-participants';

  @override
  State<EventParticipantsScreen> createState() =>
      _EventParticipantsScreenState();
}

class _EventParticipantsScreenState extends State<EventParticipantsScreen> {
  late Event _event;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _event = ModalRoute.of(context)!.settings.arguments as Event;
    _loadParticipants();
  }

  Future<void> _loadParticipants() async {
    await context.read<EventService>().fetchEventParticipants(_event.id);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_event.title),
        actions: [
          IconButton(
            icon: const Icon(Icons.qr_code_scanner),
            onPressed: () {
              Navigator.of(context).pushNamed(AdminScanScreen.routeName);
            },
            tooltip: 'Scan QR Codes',
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
                    onPressed: _loadParticipants,
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: _loadParticipants,
            child: Column(
              children: [
                // Event info header
                Container(
                  padding: const EdgeInsets.all(16),
                  color: Theme.of(context).colorScheme.surfaceContainerHighest,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _event.title,
                        style: Theme.of(context).textTheme.headlineSmall,
                      ),
                      const SizedBox(height: 8),
                      Text('Location: ${_event.location}'),
                      Text(
                          'Date: ${_event.startTime.toString().substring(0, 16)}'),
                      Text(
                          'Participants: ${eventService.eventParticipants.length}/${_event.maxParticipants}'),
                      if (_event.googleSheetUrl != null) ...[
                        const SizedBox(height: 8),
                        ElevatedButton.icon(
                          onPressed: () {
                            // In a real app, you'd use url_launcher to open the URL
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                  content: Text(
                                      'Google Sheet: ${_event.googleSheetUrl}')),
                            );
                          },
                          icon: const Icon(Icons.open_in_browser),
                          label: const Text('View Google Sheet'),
                        ),
                      ],
                    ],
                  ),
                ),

                // Participants list
                Expanded(
                  child: eventService.eventParticipants.isEmpty
                      ? const Center(
                          child: Text('No participants registered yet'),
                        )
                      : ListView.builder(
                          itemCount: eventService.eventParticipants.length,
                          itemBuilder: (context, index) {
                            final participant =
                                eventService.eventParticipants[index];
                            return Card(
                              margin: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 4),
                              child: ListTile(
                                leading: CircleAvatar(
                                  backgroundColor:
                                      participant.registrationStatus ==
                                              'attended'
                                          ? Colors.green
                                          : Colors.orange,
                                  child: Icon(
                                    participant.registrationStatus == 'attended'
                                        ? Icons.check
                                        : Icons.schedule,
                                    color: Colors.white,
                                  ),
                                ),
                                title: Text(participant.studentName),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(participant.email),
                                    if (participant.studentCode != null)
                                      Text('ID: ${participant.studentCode}'),
                                    Text(
                                      'Status: ${participant.registrationStatus}',
                                      style: TextStyle(
                                        color: participant.registrationStatus ==
                                                'attended'
                                            ? Colors.green
                                            : Colors.orange,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    if (participant.checkinTime != null)
                                      Text(
                                        'Checked in: ${participant.checkinTime!.toString().substring(0, 16)}',
                                        style: const TextStyle(
                                          color: Colors.green,
                                          fontSize: 12,
                                        ),
                                      ),
                                  ],
                                ),
                                isThreeLine: true,
                              ),
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
