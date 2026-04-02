import 'dart:convert';
import 'package:flutter/material.dart';

class ImageHelper {
  /// Returns an [ImageProvider] based on the input string.
  /// Handles base64 (data:image) and Network URLs.
  static ImageProvider? getAvatarProvider(String? avatar) {
    if (avatar == null || avatar.isEmpty) return null;
    final trimmed = avatar.trim();

    // Check if it's a data URL
    if (trimmed.startsWith('data:image')) {
      try {
        final base64String = trimmed.split(',').last;
        return MemoryImage(base64Decode(base64String));
      } catch (e) {
        debugPrint('Error decoding base64 data URL: $e');
        return null;
      }
    }

    // Check if it's a raw base64 string (often long and doesn't contain / or http)
    // If it's very long and lacks spaces/dots, it's likely base64
    if (trimmed.length > 100 && !trimmed.contains(' ') && !trimmed.contains('/') && !trimmed.contains('http')) {
       try {
        return MemoryImage(base64Decode(trimmed));
      } catch (e) {
        // Fall through to NetworkImage if decoding fails
      }
    }

    return NetworkImage(trimmed);
  }
}
