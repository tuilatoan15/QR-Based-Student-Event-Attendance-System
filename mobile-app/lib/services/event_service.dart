import 'dart:convert';

import 'package:flutter/foundation.dart';

import '../config/api_config.dart';
import '../models/event.dart';
import '../models/registration.dart';
import 'api_service.dart';

class EventService extends ChangeNotifier {
  EventService() : _api = ApiService(ApiConfig.baseUrl);

  final ApiService _api;

  List<Event> events = [];
  List<Event> myEvents = [];
  bool isLoading = false;
  String? errorMessage;

  Future<void> fetchEvents() async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.get('/api/events');
      final decoded = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200 && decoded['success'] == true) {
        final data = decoded['data'] as List<dynamic>? ?? [];
        events = data.map((e) => Event.fromJson(e as Map<String, dynamic>)).toList();
      } else {
        errorMessage = decoded['message'] as String? ?? 'Failed to fetch events';
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
      final response = await _api.post('/api/events/$id/register', authenticated: true);
      final decoded = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 201 && decoded['success'] == true) {
        final data = decoded['data'] as Map<String, dynamic>;
        final registration = Registration.fromRegisterResponse(data);
        isLoading = false;
        notifyListeners();
        return registration;
      } else {
        errorMessage = decoded['message'] as String? ?? 'Failed to register for event';
      }
    } catch (e) {
      errorMessage = 'Unable to register for event. Please try again.';
    }

    isLoading = false;
    notifyListeners();
    return null;
  }

  Future<void> fetchMyEvents() async {
    isLoading = true;
    errorMessage = null;
    notifyListeners();

    try {
      final response = await _api.get('/api/users/me/events', authenticated: true);
      final decoded = jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode == 200 && decoded['success'] == true) {
        final data = decoded['data'] as List<dynamic>? ?? [];
        myEvents = data.map((e) => Event.fromJson(e as Map<String, dynamic>)).toList();
      } else {
        errorMessage = decoded['message'] as String? ?? 'Failed to fetch my events';
      }
    } catch (e) {
      errorMessage = 'Unable to fetch my events. Please try again.';
    }

    isLoading = false;
    notifyListeners();
  }
}

