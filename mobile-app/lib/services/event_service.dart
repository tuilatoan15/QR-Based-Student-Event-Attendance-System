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
      final response = await _api.get('/api/events');
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

  /// Admin QR check-in. Returns the response data map on success, or null on
  /// failure.  The returned map may contain fields such as
  /// `student_name`, `event_title`, and `check_in_time`.
  Future<Map<String, dynamic>?> checkIn(String qrCode) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.post(
        ApiConfig.scanQrUrl(),
        authenticated: true,
        body: {'qr_token': qrCode},
      );
      final decoded = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200 && decoded['success'] == true) {
        return decoded['data'] as Map<String, dynamic>?;
      } else {
        errorMessage = decoded['message'] as String? ?? 'Check-in failed';
      }
    } catch (e) {
      errorMessage = 'Unable to check in. Please try again.';
    }

    isLoading = false;
    notifyListeners();
    return null;
  }

  // Organizer-specific methods

  Future<void> fetchOrganizerEvents() async {
    if (isLoading) return;

    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.get(
        ApiConfig.organizerEventsUrl(),
        authenticated: true,
      );
      final decoded = jsonDecode(response.body);

      if (response.statusCode == 200) {
        // Backend may return either a wrapped object or a raw list
        List<dynamic> rawList;

        if (decoded is List) {
          rawList = decoded;
        } else if (decoded is Map<String, dynamic>) {
          if (decoded['success'] == true &&
              decoded['data'] is List<dynamic>) {
            rawList = decoded['data'] as List<dynamic>;
          } else if (decoded['events'] is List<dynamic>) {
            rawList = decoded['events'] as List<dynamic>;
          } else {
            errorMessage = decoded['message'] as String? ??
                'Failed to fetch organizer events';
            isLoading = false;
            notifyListeners();
            return;
          }
        } else {
          errorMessage = 'Failed to parse organizer events response';
          isLoading = false;
          notifyListeners();
          return;
        }

        organizerEvents = rawList
            .whereType<Map<String, dynamic>>()
            .map(Event.fromJson)
            .toList();
      } else if (decoded is Map<String, dynamic>) {
        errorMessage =
            decoded['message'] as String? ?? 'Failed to fetch organizer events';
      } else {
        errorMessage = 'Failed to fetch organizer events';
      }
    } catch (e) {
      errorMessage = 'Unable to fetch organizer events. Please try again.';
    }

    isLoading = false;
    notifyListeners();
  }

  Future<Event?> createEvent({
    required String title,
    String? description,
    required String location,
    required DateTime startTime,
    required DateTime endTime,
    required int maxParticipants,
    int? categoryId,
  }) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.post(
        ApiConfig.eventsUrl(),
        authenticated: true,
        body: {
          'title': title,
          'description': description,
          'location': location,
          'start_time': startTime.toIso8601String(),
          'end_time': endTime.toIso8601String(),
          'max_participants': maxParticipants,
          if (categoryId != null) 'category_id': categoryId,
        },
      );
      final decoded = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 201 && decoded['success'] == true) {
        final data = decoded['data'] as Map<String, dynamic>;
        final event = Event.fromJson(data);
        isLoading = false;
        notifyListeners();
        return event;
      } else {
        errorMessage =
            decoded['message'] as String? ?? 'Failed to create event';
      }
    } catch (e) {
      errorMessage = 'Unable to create event. Please try again.';
    }

    isLoading = false;
    notifyListeners();
    return null;
  }

  Future<bool> updateEvent(
    int eventId, {
    String? title,
    String? description,
    String? location,
    DateTime? startTime,
    DateTime? endTime,
    int? maxParticipants,
    int? categoryId,
    bool? isActive,
  }) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final updateData = <String, dynamic>{};
      if (title != null) updateData['title'] = title;
      if (description != null) updateData['description'] = description;
      if (location != null) updateData['location'] = location;
      if (startTime != null) {
        updateData['start_time'] = startTime.toIso8601String();
      }
      if (endTime != null) {
        updateData['end_time'] = endTime.toIso8601String();
      }
      if (maxParticipants != null) {
        updateData['max_participants'] = maxParticipants;
      }
      if (categoryId != null) updateData['category_id'] = categoryId;
      if (isActive != null) updateData['is_active'] = isActive;

      final response = await _api.put(
        '${ApiConfig.eventsUrl()}/$eventId',
        authenticated: true,
        body: updateData,
      );
      final decoded = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200 && decoded['success'] == true) {
        isLoading = false;
        notifyListeners();
        return true;
      } else {
        errorMessage =
            decoded['message'] as String? ?? 'Failed to update event';
      }
    } catch (e) {
      errorMessage = 'Unable to update event. Please try again.';
    }

    isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> deleteEvent(int eventId) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.delete(
        '${ApiConfig.eventsUrl()}/$eventId',
        authenticated: true,
      );
      final decoded = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200 && decoded['success'] == true) {
        // Remove from organizer events list
        organizerEvents.removeWhere((event) => event.id == eventId);
        isLoading = false;
        notifyListeners();
        return true;
      } else {
        errorMessage =
            decoded['message'] as String? ?? 'Failed to delete event';
      }
    } catch (e) {
      errorMessage = 'Unable to delete event. Please try again.';
    }

    isLoading = false;
    notifyListeners();
    return false;
  }

  Future<void> fetchEventParticipants(int eventId) async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.get(
        ApiConfig.eventParticipantsUrl(eventId),
        authenticated: true,
      );
      final decoded = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200 && decoded['success'] == true) {
        final data = decoded['data'] as List<dynamic>? ?? [];
        eventParticipants = data
            .map((p) => EventParticipant.fromJson(p as Map<String, dynamic>))
            .toList();
      } else {
        errorMessage =
            decoded['message'] as String? ?? 'Failed to fetch participants';
      }
    } catch (e) {
      errorMessage = 'Unable to fetch participants. Please try again.';
    }

    isLoading = false;
    notifyListeners();
  }
}
