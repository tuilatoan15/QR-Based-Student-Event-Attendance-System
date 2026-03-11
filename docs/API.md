# API Documentation (REST)

Base URL (local): `http://localhost:5000/api`

## Conventions

- **Auth**: `Authorization: Bearer <JWT>`
- **Mobile client header**: `X-Client: mobile-app`  
  Backend enforces **student-only** logins when this header is present.
- **Response shape** (typical):

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

---

## Authentication endpoints

### POST `/auth/register` (student only)

Creates a student account (backend forces role to `student`).

**Request**

```json
{
  "full_name": "Nguyen Van A",
  "email": "student1@university.edu",
  "password": "123456",
  "student_code": "SV001"
}
```

**Response (201)**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 3,
      "full_name": "Nguyen Van A",
      "email": "student1@university.edu",
      "role": "student"
    },
    "token": "<jwt>"
  }
}
```

### POST `/auth/login`

Logs in and returns a JWT.

**Request**

```json
{
  "email": "student1@university.edu",
  "password": "123456"
}
```

**Response (200)**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 3,
      "full_name": "Nguyen Van A",
      "email": "student1@university.edu",
      "role": "student"
    },
    "token": "<jwt>"
  }
}
```

**Notes**
- If the request includes header `X-Client: mobile-app`, the backend **rejects non-student roles** with `403`.

---

## Event endpoints

### GET `/events`

Lists public events (supports pagination).

**Query params**
- `page` (default `1`)
- `limit` (default `10`)

**Response (200)**

```json
{
  "success": true,
  "message": "Events retrieved successfully",
  "data": [
    {
      "id": 1,
      "title": "Introduction to Flutter Development",
      "location": "Room 101",
      "start_time": "2024-12-01T10:00:00.000Z",
      "end_time": "2024-12-01T12:00:00.000Z",
      "max_participants": 50,
      "is_active": true
    }
  ],
  "meta": { "page": 1, "limit": 10 }
}
```

### GET `/events/:id`

Gets an event by id.

**Response (200)**

```json
{
  "success": true,
  "message": "Event retrieved successfully",
  "data": {
    "id": 1,
    "title": "Introduction to Flutter Development",
    "description": "Learn the basics of Flutter mobile app development",
    "location": "Room 101",
    "start_time": "2024-12-01T10:00:00.000Z",
    "end_time": "2024-12-01T12:00:00.000Z",
    "max_participants": 50,
    "created_by": 2,
    "google_sheet_name": null,
    "is_active": true
  }
}
```

### POST `/events/:id/register` (student)

Registers the authenticated student for the event and returns a `qr_token`.

**Headers**
- `Authorization: Bearer <jwt>`

**Response (201)**

```json
{
  "success": true,
  "message": "Registered successfully",
  "data": {
    "registration": { "id": 10, "event_id": "1", "user_id": 3 },
    "qr_token": "6c1a8c8c-3c2b-4c1c-9f3a-...-token",
    "qr_code": "data:image/png;base64,iVBORw0KGgoAAA..."
  }
}
```

### DELETE `/events/:id/register` (student)

Cancels the authenticated student’s registration.

**Headers**
- `Authorization: Bearer <jwt>`

**Response (200)**

```json
{
  "success": true,
  "message": "Registration cancelled successfully",
  "data": null
}
```

### GET `/events/organizer/events` (admin/organizer)

Lists events for the dashboard.

**Headers**
- `Authorization: Bearer <jwt>`

**Response (200)**

```json
{
  "success": true,
  "message": "Events retrieved successfully",
  "data": [
    { "id": 1, "title": "Introduction to Flutter Development" }
  ],
  "meta": { "page": 1, "limit": 10 }
}
```

### POST `/events` (admin/organizer)

Creates an event. Backend attempts to create a Google Sheet for the event (non-blocking if it fails).

**Headers**
- `Authorization: Bearer <jwt>`

**Request**

```json
{
  "title": "AI Workshop",
  "description": "Hands-on session",
  "location": "Computer Lab",
  "start_time": "2026-03-12T09:00:00.000Z",
  "end_time": "2026-03-12T12:00:00.000Z",
  "max_participants": 50,
  "category_id": 4
}
```

**Response (201)**

```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "id": 5,
    "title": "AI Workshop",
    "location": "Computer Lab",
    "max_participants": 50,
    "created_by": 2,
    "google_sheet": {
      "id": "<sheetId>",
      "name": "Event_5_AI_Workshop",
      "url": "https://docs.google.com/spreadsheets/d/<id>/edit"
    }
  }
}
```

### PUT `/events/:id` (admin/organizer)

Updates an event (partial update supported).

### DELETE `/events/:id` (admin/organizer)

Soft-deletes an event.

### GET `/events/:id/registrations` (admin/organizer)

Returns participants for an event. Backend also checks that organizers can only view their own events.

### GET `/events/event/:id/members` (admin/organizer)

Returns registrations/members list for an event.

---

## Registration endpoints

Registrations are managed via event endpoints:
- `POST /events/:id/register`
- `DELETE /events/:id/register`

Backend data model:
- `registrations.qr_token` is unique and is the payload encoded into the QR code.
- `registrations.status` ∈ `registered | attended | cancelled`

---

## Attendance endpoints

### POST `/attendance/scan-qr` (admin/organizer)

Scans a QR and records attendance atomically:
- inserts `attendances`
- updates `registrations.status = 'attended'`

**Headers**
- `Authorization: Bearer <jwt>`

**Request**

```json
{
  "qr_token": "6c1a8c8c-3c2b-4c1c-9f3a-...-token"
}
```

**Response (200)**

```json
{
  "success": true,
  "message": "Check-in successful",
  "data": {
    "registration_id": 10,
    "student_name": "Nguyen Van A",
    "event_id": 1,
    "event_title": "Introduction to Flutter Development",
    "checked_in_by": 2,
    "check_in_time": "2026-03-12T03:10:00.000Z"
  }
}
```

**Error cases**
- `404 Invalid QR code`
- `409 Already checked in`
- `400 qr_token is required`

### GET `/attendance/event/:id` (admin/organizer)

Lists attendance records for an event.

**Headers**
- `Authorization: Bearer <jwt>`

**Response (200)**

```json
{
  "success": true,
  "message": "Attendances retrieved successfully",
  "data": [
    {
      "registration_id": 10,
      "checkin_time": "2026-03-12T03:10:00.000Z",
      "checkin_by": 2
    }
  ]
}
```

