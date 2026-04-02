import 'dart:convert';

import 'package:flutter/foundation.dart';

import '../config/api_config.dart';
import '../models/event.dart';
import '../models/event_participant.dart';
import '../models/registration.dart';
import 'api_service.dart';

class EventService extends ChangeNotifier {
  EventService() : _api = ApiService(ApiConfig.baseUrl);

  final ApiService _api;

  List<Event> events = [];
  List<Event> myEvents = [];
  List<Event> organizerEvents = [];
  List<EventParticipant> eventParticipants = [];
  bool isLoading = false;
  String? errorMessage;
  Map<String, Registration?> _registrations = {}; // Dùng String cho MongoDB ObjectId

  Future<void> fetchEvents() async {
    if (isLoading) return;

    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.get('/api/events?limit=100');
      final decoded = jsonDecode(response.body);

      if (response.statusCode == 200 && decoded is Map && decoded['success'] == true) {
        final data = decoded['data'] as List<dynamic>? ?? [];
        events = data.map((e) => Event.fromJson(e as Map<String, dynamic>)).toList();
      } else {
        errorMessage = decoded is Map ? decoded['message'] : 'Failed to fetch events';
      }
    } catch (e) {
      errorMessage = 'Unable to fetch events. Error: $e';
    }

    isLoading = false;
    notifyListeners();
  }

  Future<Event?> fetchEventDetail(dynamic id) async {
    try {
      final response = await _api.get('/api/events/$id');
      final decoded = jsonDecode(response.body);

      if (response.statusCode == 200 && decoded is Map && decoded['success'] == true) {
        return Event.fromJson(decoded['data'] as Map<String, dynamic>);
      } else {
        errorMessage = decoded is Map ? decoded['message'] : 'Failed to fetch event';
      }
    } catch (e) {
      errorMessage = 'Error: $e';
    }

    notifyListeners();
    return null;
  }

  Future<Registration?> registerForEvent(dynamic id) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.post('/api/events/$id/register', authenticated: true);
      final decoded = jsonDecode(response.body);

      if (response.statusCode == 201 && decoded is Map && decoded['success'] == true) {
        final data = decoded['data'] as Map<String, dynamic>;
        final registration = Registration.fromRegisterResponse(data);
        _registrations[id.toString()] = registration;
        isLoading = false;
        notifyListeners();
        return registration;
      } else {
        errorMessage = decoded is Map ? decoded['message'] : 'Failed to register';
      }
    } catch (e) {
      errorMessage = 'Error: $e';
    }

    isLoading = false;
    notifyListeners();
    return null;
  }

  Future<bool> cancelRegistration(dynamic eventId) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.delete('/api/events/$eventId/register', authenticated: true);
      final decoded = jsonDecode(response.body);

      if (response.statusCode == 200 && decoded is Map && decoded['success'] == true) {
        _registrations[eventId.toString()] = null;
        isLoading = false;
        notifyListeners();
        return true;
      } else {
        errorMessage = decoded is Map ? decoded['message'] : 'Failed to cancel';
      }
    } catch (e) {
      errorMessage = 'Error: $e';
    }

    isLoading = false;
    notifyListeners();
    return false;
  }

  Registration? getRegistration(dynamic eventId) {
    return _registrations[eventId.toString()];
  }

  bool isUserRegistered(dynamic eventId) {
    return _registrations[eventId.toString()] != null;
  }

  Future<void> fetchMyEvents() async {
    if (isLoading) return;

    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.get('/api/users/me/events', authenticated: true);
      final decoded = jsonDecode(response.body);

      if (response.statusCode == 200 && decoded is Map && decoded['success'] == true) {
        final data = decoded['data'] as List<dynamic>? ?? [];
        myEvents = data.map((e) => Event.fromJson(e as Map<String, dynamic>)).toList();

        for (final eventData in data) {
          if (eventData is Map<String, dynamic>) {
            final eventId = eventData['id']?.toString() ?? eventData['_id']?.toString();
            final regData = eventData['registration'];

            if (eventId != null && regData != null && regData is Map<String, dynamic>) {
              try {
                final registration = Registration(
                  registrationId: regData['id']?.toString() ?? regData['_id']?.toString() ?? '',
                  eventId: eventId,
                  userId: regData['user_id']?.toString() ?? '',
                  qrToken: regData['qr_token'] ?? '',
                  status: 'registered',
                );
                _registrations[eventId] = registration;
              } catch (e) {}
            }
          }
        }
      } else {
        errorMessage = decoded is Map ? decoded['message'] : 'Failed to fetch my events';
      }
    } catch (e) {
      errorMessage = 'Error: $e';
    }

    isLoading = false;
    notifyListeners();
  }

  void clearData() {
    events = [];
    myEvents = [];
    organizerEvents = [];
    eventParticipants = [];
    _registrations = {};
    errorMessage = null;
    notifyListeners();
  }
}
