import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:image_picker/image_picker.dart';
import '../config/api_config.dart';

class AvatarService {
  final ImagePicker _picker = ImagePicker();

  /// Picks an image from the gallery and uploads it to the backend.
  /// Returns the secure URL of the uploaded image on success, or null on failure.
  Future<String?> pickAndUploadAvatar() async {
    try {
      // 1. Pick image
      final XFile? image = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 80,
      );

      if (image == null) {
        return null; // User canceled
      }

      // 2. Prepare multipart request
      final uri = Uri.parse(ApiConfig.uploadAvatarUrl());
      final request = http.MultipartRequest('POST', uri);

      // Add the file to the request
      final fileBytes = await image.readAsBytes();
      final multipartFile = http.MultipartFile.fromBytes(
        'avatar', // Must match the field name expected by multer in the backend
        fileBytes,
        filename: image.name,
      );
      request.files.add(multipartFile);

      // Add authorization header if you have a token mechanism here:
      // final prefs = await SharedPreferences.getInstance();
      // final token = prefs.getString('token');
      // if (token != null) {
      //   request.headers['Authorization'] = 'Bearer $token';
      // }

      // 3. Send request
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      // 4. Handle response
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['data'] != null) {
          return data['data']['secure_url'];
        }
      }
      return null;
    } catch (e) {
      print('Error uploading avatar: $e');
      return null;
    }
  }
}
