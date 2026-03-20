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
  Map<int, Registration?> _registrations =
      {}; // Track registrations by event ID

  Future<void> fetchEvents() async {
    if (isLoading) return;

    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.get('/api/events?limit=100');
      final decoded = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200 && decoded['success'] == true) {
        final data = decoded['data'] as List<dynamic>? ?? [];
        events =
            data.map((e) => Event.fromJson(e as Map<String, dynamic>)).toList();
      } else {
        errorMessage =
            decoded['message'] as String? ?? 'Failed to fetch events';
      }
    } catch (e) {
      errorMessage = 'Unable to fetch events. Please try again.';
    }

    isLoading = false;
    notifyListeners();
  }

  Future<Event?> fetchEventDetail(int id) async {
    try {
      final response = await _api.get('/api/events/$id');
      final decoded = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200 && decoded['success'] == true) {
        return Event.fromJson(decoded['data'] as Map<String, dynamic>);
      } else {
        errorMessage = decoded['message'] as String? ?? 'Failed to fetch event';
      }
    } catch (e) {
      errorMessage = 'Unable to fetch event. Please try again.';
    }

    notifyListeners();
    return null;
  }

  Future<Registration?> registerForEvent(int id) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response =
          await _api.post('/api/events/$id/register', authenticated: true);
      final decoded = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 201 && decoded['success'] == true) {
        final data = decoded['data'] as Map<String, dynamic>;
        final registration = Registration.fromRegisterResponse(data);
        _registrations[id] = registration;
        isLoading = false;
        notifyListeners();
        return registration;
      } else {
        errorMessage =
            decoded['message'] as String? ?? 'Failed to register for event';
      }
    } catch (e) {
      errorMessage = 'Unable to register for event. Please try again.';
    }

    isLoading = false;
    notifyListeners();
    return null;
  }

  Future<bool> cancelRegistration(int eventId) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.delete(
        '/api/events/$eventId/register',
        authenticated: true,
      );
      final decoded = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200 && decoded['success'] == true) {
        _registrations[eventId] = null;
        isLoading = false;
        notifyListeners();
        return true;
      } else {
        errorMessage =
            decoded['message'] as String? ?? 'Failed to cancel registration';
      }
    } catch (e) {
      errorMessage = 'Unable to cancel registration. Please try again.';
    }

    isLoading = false;
    notifyListeners();
    return false;
  }

  Registration? getRegistration(int eventId) {
    return _registrations[eventId];
  }

  bool isUserRegistered(int eventId) {
    return _registrations[eventId] != null;
  }

  Future<void> fetchMyEvents() async {
    if (isLoading) return;

    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.get(
        '/api/users/me/events',
        authenticated: true,
      );
      final decoded = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200 && decoded['success'] == true) {
        final data = decoded['data'] as List<dynamic>? ?? [];
        myEvents =
            data.map((e) => Event.fromJson(e as Map<String, dynamic>)).toList();

        // Populate registration cache from response
        // If the response includes registration data, extract it
        final eventsList = decoded['data'] as List<dynamic>? ?? [];
        for (final eventData in eventsList) {
          if (eventData is Map<String, dynamic>) {
            final eventId = eventData['id'] as int?;
            final registrationData =
                eventData['registration'] as Map<String, dynamic>?;

            if (eventId != null && registrationData != null) {
              try {
                // Reconstruct Registration from event response data
                final registration = Registration(
                  registrationId: registrationData['id'] as int? ?? 0,
                  eventId: eventId,
                  userId: registrationData['user_id'] as int? ?? 0,
                  qrToken: registrationData['qr_token'] as String? ??
                      eventData['qr_code'] as String? ??
                      '',
                  status: 'registered',
                );
                _registrations[eventId] = registration;
              } catch (e) {
                // Skip if registration data format is invalid
              }
            }
          }
        }
      } else {
        errorMessage =
            decoded['message'] as String? ?? 'Failed to fetch my events';
      }
    } catch (e) {
      errorMessage = 'Unable to fetch my events. Please try again.';
    }

    isLoading = false;
    notifyListeners();
  }

}
