import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/event.dart';
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
    final event = await eventService.fetchEventDetail(id);
    if (mounted) {
      setState(() {
        _event = event;
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
      Navigator.of(context).pushNamed(
        QRScreen.routeName,
        arguments: registration.qrToken,
      );
    } else if (eventService.errorMessage != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(eventService.errorMessage!)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final eventService = context.watch<EventService>();

    return Scaffold(
      appBar: AppBar(title: const Text('Event Detail')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: _event == null
            ? Center(
                child: eventService.isLoading
                    ? const CircularProgressIndicator()
                    : const Text('Loading event...'),
              )
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _event!.title,
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 8),
                  Text(_event!.location),
                  const SizedBox(height: 8),
                  Text(
                    '${_event!.startTime.toLocal()} - ${_event!.endTime.toLocal()}',
                  ),
                  const SizedBox(height: 16),
                  if (_event!.description != null && _event!.description!.isNotEmpty)
                    Text(_event!.description!),
                  const Spacer(),
                  PrimaryButton(
                    label: 'Register for Event',
                    isLoading: eventService.isLoading,
                    onPressed: _register,
                  ),
                ],
              ),
      ),
    );
  }
}

