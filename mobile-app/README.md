# smart_event_attendance_mobile

The mobile companion app for the QR‑Based Student Event Attendance System.  Students can browse events, register, and display their QR code for check‑in.  Organizers and admins can scan QR codes to record attendance.

## Project Overview

- **View events**: Browse active events fetched from the backend API.
- **Register**: Authenticate as a student and register for an event to receive a QR code.
- **QR display**: Show the generated QR code for scanning at event check‑in.
- **Scan attendance**: (For organizers/admins) use the built‑in camera scanner to check students in via QR.

The app communicates with the REST API hosted by the `event-system` backend.

## Getting Started

### Prerequisites

- [Flutter SDK](https://docs.flutter.dev/get-started/install)
- Android Studio / Xcode (for emulators)

### Running the App

```bash
cd mobile-app
flutter pub get
flutter run
```

Select an emulator or connected device when prompted.

### Notes

- Backend URL can be configured in `lib/config.dart` (or similar) depending on environment.
- The project uses `mobile_scanner` for QR scanning and `http` for API calls.

Further development guidelines are available in the root repository README.

---

(Original Flutter starter content retained for reference.)
