# QR-Based Student Event Attendance System

**Backend API for event registration and QR-based attendance check-in**

A production-ready REST API that enables students to register for events, receive unique QR codes, and check in at events via QR scan. Built with Node.js, Express, and SQL Server for a clear, maintainable backend suitable for campus or organizational events.

---

## Project Description

This system supports:

- **User management:** Registration and login with JWT; role-based access (admin, organizer, student).
- **Event management:** CRUD for events (create, read, update, soft delete) with categories and capacity.
- **Event registration:** Students register for events and receive a unique QR token and QR code image (Data URL).
- **QR-based attendance:** Organizers or admins scan the student’s QR code to record check-in; the API validates the event is active and prevents duplicate check-in.
- **Reporting:** List events, a user’s registered events, and per-event registrations and attendances.

The API is documented with Swagger, uses structured logging and rate limiting on auth, and returns consistent JSON responses.

---

## Tech Stack

| Category        | Technology |
|----------------|------------|
| Runtime        | Node.js    |
| Framework      | Express.js |
| Database       | SQL Server (mssql driver) |
| Auth           | JWT (jsonwebtoken), bcrypt |
| Security       | Helmet, CORS, express-rate-limit |
| Documentation  | Swagger (swagger-jsdoc, swagger-ui-express) |
| Logging        | Winston, Morgan |
| QR             | qrcode, uuid |

---

## Project Architecture

```
event-system/
├── src/
│   └── app.js                # Express app (used by server and tests)
├── config/
│   └── db.js                 # SQL Server connection pool
├── docs/
│   └── swagger.js            # OpenAPI spec and Swagger UI setup
├── controllers/
│   ├── authController.js     # Register, login
│   ├── eventController.js    # Events CRUD, register for event, lists
│   └── attendanceController.js  # QR check-in
├── middlewares/
│   ├── authMiddleware.js     # JWT verification, req.user
│   ├── roleMiddleware.js     # Role-based access (admin, organizer, student)
│   ├── errorMiddleware.js    # Global error handler and logging
│   ├── errorHandler.js       # Central error handler implementation
│   ├── rateLimitMiddleware.js # Rate limits (auth + global /api)
│   ├── validateId.js         # Centralized ID validation for :id params
│   └── validators/
│       ├── authValidator.js  # Register/login validation
│       └── eventValidator.js # Create/update event validation
├── models/
│   ├── userModel.js          # Users and roles data access
│   ├── eventModel.js         # Events data access
│   └── registrationModel.js  # Registrations and attendances data access
├── routes/
│   ├── authRoutes.js         # POST /register, /login
│   ├── userRoutes.js         # GET /me/events
│   ├── eventRoutes.js        # Events CRUD + register, registrations, attendances
│   └── attendanceRoutes.js   # POST /checkin
├── utils/
│   ├── response.js           # successResponse, paginatedSuccessResponse, errorResponse
│   ├── qrGenerator.js        # UUID token and QR Data URL generation
│   └── logger.js             # Winston logger and helpers
├── tests/                    # Jest + supertest API tests
├── database.sql              # Schema and seed data
├── Dockerfile                # Backend Docker image
├── docker-compose.yml        # Backend + SQL Server stack
├── jest.config.js            # Jest configuration
├── server.js                 # App entry: bootstraps src/app.js
├── package.json
└── README.md
```

**Request flow:** Route → (optional) auth → (optional) role check → Controller → Model (DB) → Response.

---

## Database Schema Overview

- **roles** – admin, organizer, student.
- **users** – full_name, email, password_hash, student_code, role_id, is_active, timestamps.
- **event_categories** – name, description (optional).
- **events** – title, description, location, start_time, end_time, max_participants, category_id, created_by, is_active, created_at.
- **registrations** – user_id, event_id, qr_token (unique), status (registered | attended | cancelled), registered_at. Unique (user_id, event_id).
- **attendances** – registration_id (unique), checkin_time, checkin_by (user id). One row per registration (one check-in per registration).
- **refresh_tokens** – (reserved for future use).
- **audit_logs** – (reserved for future use).

Foreign keys link users → roles, events → categories and created_by, registrations → users and events, attendances → registrations and checkin_by. Indexes on users.email, events.start_time, registrations.event_id and user_id.

---

## API Documentation

**Swagger UI:** [http://localhost:5000/api/docs](http://localhost:5000/api/docs)

### Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST   | /api/auth/register | No  | Register (student) |
| POST   | /api/auth/login    | No  | Login |
| GET    | /api/events        | No  | List active events |
| GET    | /api/events/:id    | No  | Get event by id |
| POST   | /api/events        | Yes (admin/organizer) | Create event |
| PUT    | /api/events/:id    | Yes (admin/organizer) | Update event |
| DELETE | /api/events/:id    | Yes (admin/organizer) | Soft delete event |
| POST   | /api/events/:id/register | Yes (student) | Register for event; returns qr_token and qr_code |
| GET    | /api/events/:id/registrations | Yes (admin/organizer) | List registrations for event |
| GET    | /api/events/:id/attendances  | Yes (admin/organizer) | List attendances for event |
| GET    | /api/users/me/events | Yes | Current user’s registered events |
| POST   | /api/attendance/checkin | Yes (admin/organizer) | Check-in by qr_token or qr_code |

Protected routes use header: `Authorization: Bearer <JWT>`.

---

## How to Run the Project

### Prerequisites

- Node.js (v16+ recommended)
- SQL Server (local or remote)
- npm or yarn

### Steps

1. **Clone and install**

   ```bash
   git clone <repository-url>
   cd event-system
   npm install
   ```

2. **Environment**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your values:

   - `PORT` (default 5000)
   - `DB_USER`, `DB_PASSWORD`, `DB_SERVER`, `DB_NAME` (and optionally `DB_PORT`)
   - `JWT_SECRET` (use a long, random secret in production)
   - Optional: `JWT_EXPIRES_IN`, `BCRYPT_SALT_ROUNDS`, `LOG_LEVEL`, `NODE_ENV`

3. **Database**

   Run the script `database.sql` in SQL Server to create the database and tables (roles, users, events, registrations, attendances, etc.).

4. **Start server**

   ```bash
   npm start
   ```

   For development with auto-reload:

   ```bash
   npm run dev
   ```

   You should see:

   ```
   SQL Server connected
   Server running on port 5000
   ```

5. **Try the API**

   - Open [http://localhost:5000/api/docs](http://localhost:5000/api/docs) for Swagger UI.
   - Use Postman or curl with the examples below.

---

## How to Test

The project includes basic Jest + supertest API tests.

```bash
cd event-system
npm test
```

> Lưu ý: Các test hiện tại tập trung vào validation và các response cơ bản (không khởi chạy SQL Server). Bạn có thể mở rộng thêm integration test thực tế bằng cách cấu hình DB test riêng.

---

## Docker Usage

You can run the backend and SQL Server using Docker Compose.

### Build and run

```bash
cd event-system
docker-compose up --build
```

This will:

- Start SQL Server on port `1433`
- Build and start the backend service on port `5000`

Once running, access:

- API: `http://localhost:5000`
- Swagger: `http://localhost:5000/api/docs`

---

## Example API Requests

### Register

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Nguyen Van A","email":"student@example.com","password":"SecurePass123","student_code":"SV001"}'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@example.com","password":"SecurePass123"}'
```

Use the returned `token` in the next requests.

### List events

```bash
curl http://localhost:5000/api/events
```

### Create event (admin/organizer)

```bash
curl -X POST http://localhost:5000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"title":"Tech Talk 2025","location":"Room A1","start_time":"2025-04-01T09:00:00Z","end_time":"2025-04-01T11:00:00Z","max_participants":50}'
```

### Register for event (student)

```bash
curl -X POST http://localhost:5000/api/events/1/register \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response includes `qr_token` and `qr_code` (Data URL image).

### Check-in (admin/organizer)

```bash
curl -X POST http://localhost:5000/api/attendance/checkin \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"qr_token":"UUID_FROM_REGISTRATION_RESPONSE"}'
```

### Response format

**Success**

```json
{
  "success": true,
  "message": "Success",
  "data": { ... }
}
```

**Error**

```json
{
  "success": false,
  "message": "Error message"
}
```

---

## Future Improvements

- **Validation layer:** Centralized request validation (e.g. express-validator or Joi) for all inputs.
- **Service layer:** Move business logic from controllers to services for testability and reuse.
- **Tests:** Unit and integration tests for auth, events, and attendance.
- **Pagination:** Add `page` and `limit` to list endpoints (events, registrations, attendances).
- **Refresh tokens:** Implement refresh flow using the `refresh_tokens` table.
- **Audit logs:** Use `audit_logs` for sensitive actions (login, check-in, event updates).
- **Health check:** Add `GET /health` or `GET /api/health` for monitoring.
- **API versioning:** Prefix routes with `/api/v1/` for future compatibility.

---

## License

MIT
