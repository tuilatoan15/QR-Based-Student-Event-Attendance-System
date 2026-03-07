import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/event.dart';
import '../models/registration.dart';
import '../services/event_service.dart';
import '../widgets/primary_button.dart';
import 'qr_screen.dart';

class EventDetailScreen extends StatefulWidget {
  const EventDetailScreen({super.key});

  static const String routeName = '/events/detail';

  @override
  State<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends State<EventDetailScreen> {
  Event? _event;
  Registration? _registration;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final id = ModalRoute.of(context)?.settings.arguments as int?;
    if (id != null && _event == null) {
      _loadEvent(id);
    }
  }

  Future<void> _loadEvent(int id) async {
    final eventService = context.read<EventService>();

    // Load the event detail
    final event = await eventService.fetchEventDetail(id);

    // Also fetch myEvents to populate registration cache
    await eventService.fetchMyEvents();

    if (mounted) {
      setState(() {
        _event = event;
        _registration = eventService.getRegistration(id);
      });
    }
  }

  Future<void> _register() async {
    final id = _event?.id;
    if (id == null) return;

    final eventService = context.read<EventService>();
    final registration = await eventService.registerForEvent(id);

    if (!mounted) return;

    if (registration != null) {
      setState(() {
        _registration = registration;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Successfully registered for event!'),
          backgroundColor: Colors.green,
        ),
      );
    } else if (eventService.errorMessage != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(eventService.errorMessage!),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _showQRCode() async {
    if (_registration == null) return;

    if (!mounted) return;

    Navigator.of(context).pushNamed(
      QRScreen.routeName,
      arguments: {
        'event': _event,
        'registration': _registration,
      },
    );
  }

  Future<void> _cancelRegistration() async {
    final id = _event?.id;
    if (id == null) return;

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Registration'),
        content:
            const Text('Are you sure you want to cancel this registration?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('No'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Yes, Cancel'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    final eventService = context.read<EventService>();
    final success = await eventService.cancelRegistration(id);

    if (!mounted) return;

    if (success) {
      setState(() {
        _registration = null;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Registration cancelled'),
          backgroundColor: Colors.green,
        ),
      );
    } else if (eventService.errorMessage != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(eventService.errorMessage!),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  String _formatDateTime(DateTime dateTime) {
    final date = dateTime.toLocal();
    final months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];
    final hour = date.hour.toString().padLeft(2, '0');
    final minute = date.minute.toString().padLeft(2, '0');
    return '${months[date.month - 1]} ${date.day}, ${date.year} at $hour:$minute';
  }

  @override
  Widget build(BuildContext context) {
    final eventService = context.watch<EventService>();
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Event Details')),
      body: _event == null
          ? Center(
              child: eventService.isLoading
                  ? const CircularProgressIndicator()
                  : const Text('Loading event...'),
            )
          : SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primaryContainer,
                      borderRadius: const BorderRadius.only(
                        bottomLeft: Radius.circular(16),
                        bottomRight: Radius.circular(16),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _event!.title,
                          style: theme.textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                            color: theme.colorScheme.onPrimaryContainer,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Icon(
                              Icons.location_on,
                              size: 18,
                              color: theme.colorScheme.onPrimaryContainer,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _event!.location,
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  color: theme.colorScheme.onPrimaryContainer,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Event Schedule',
                                  style: theme.textTheme.titleSmall?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                Row(
                                  children: [
                                    Icon(
                                      Icons.calendar_today,
                                      size: 18,
                                      color: theme.colorScheme.primary,
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            'Start',
                                            style: theme.textTheme.labelSmall
                                                ?.copyWith(
                                              color: theme
                                                  .colorScheme.onSurfaceVariant,
                                            ),
                                          ),
                                          Text(
                                            _formatDateTime(_event!.startTime),
                                            style: theme.textTheme.bodySmall
                                                ?.copyWith(
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                Row(
                                  children: [
                                    Icon(
                                      Icons.event_available,
                                      size: 18,
                                      color: theme.colorScheme.primary,
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            'End',
                                            style: theme.textTheme.labelSmall
                                                ?.copyWith(
                                              color: theme
                                                  .colorScheme.onSurfaceVariant,
                                            ),
                                          ),
                                          Text(
                                            _formatDateTime(_event!.endTime),
                                            style: theme.textTheme.bodySmall
                                                ?.copyWith(
                                              fontWeight: FontWeight.w500,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        if (_event!.description != null &&
                            _event!.description!.isNotEmpty)
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Description',
                                style: theme.textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                _event!.description!,
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  color: theme.colorScheme.onSurfaceVariant,
                                ),
                              ),
                              const SizedBox(height: 16),
                            ],
                          ),
                        Card(
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.people,
                                  color: theme.colorScheme.primary,
                                ),
                                const SizedBox(width: 12),
                                Text(
                                  'Max ${_event!.maxParticipants} participants',
                                  style: theme.textTheme.bodyMedium?.copyWith(
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 24),
                        if (_registration == null)
                          PrimaryButton(
                            label: 'Register for Event',
                            isLoading: eventService.isLoading,
                            onPressed: _register,
                          )
                        else
                          Row(
                            children: [
                              Expanded(
                                child: ElevatedButton.icon(
                                  onPressed: eventService.isLoading
                                      ? null
                                      : _showQRCode,
                                  icon: const Icon(Icons.qr_code_2),
                                  label: const Text('Show QR Code'),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: ElevatedButton.icon(
                                  onPressed: eventService.isLoading
                                      ? null
                                      : _cancelRegistration,
                                  icon: const Icon(Icons.close),
                                  label: const Text('Cancel'),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.red,
                                    foregroundColor: Colors.white,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        const SizedBox(height: 16),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
