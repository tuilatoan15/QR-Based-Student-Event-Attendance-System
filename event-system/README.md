# QR-Based Student Event Attendance System

Production-ready backend API for event registration and QR-based attendance check-in. Built with Node.js, Express, and SQL Server.

## Tech Stack

- **Node.js** + **Express.js**
- **SQL Server** (mssql driver)
- **JWT** authentication
- **bcrypt** password hashing
- **dotenv** environment config
- **Helmet** security headers
- **CORS** enabled
- **Swagger** API documentation (swagger-jsdoc, swagger-ui-express)
- **Winston** + **Morgan** logging
- **express-rate-limit** on auth routes
- **qrcode** + **uuid** for QR generation

## Features

- User registration & login (JWT)
- Role-based access (admin, organizer, student)
- Event CRUD (create, read, update, soft delete)
- Student event registration with unique QR token and QR image (Data URL)
- QR-based attendance check-in (validates event active, prevents duplicate check-in)
- List user's events and event registrations/attendances
- Rate limiting on authentication (e.g. 5 requests/minute per IP)
- Structured logging (error.log, combined.log)
- Global error handler and standardized API responses

## API Documentation

**Swagger UI:** [http://localhost:5000/api/docs](http://localhost:5000/api/docs)

All endpoints are documented with request/response schemas.

## API List

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register (student) |
| POST | /api/auth/login | Login |
| GET | /api/events | List events |
| GET | /api/events/:id | Get event by id |
| POST | /api/events | Create event (admin/organizer) |
| PUT | /api/events/:id | Update event |
| DELETE | /api/events/:id | Soft delete event |
| POST | /api/events/:id/register | Register for event; returns qr_token and qr_code (image) |
| GET | /api/events/:id/registrations | List registrations (admin/organizer) |
| GET | /api/events/:id/attendances | List attendances (admin/organizer) |
| GET | /api/users/me/events | Current user's registered events |
| POST | /api/attendance/checkin | Check-in by qr_token (admin/organizer) |

## Project Structure

```
event-system/
├── config/
│   └── db.js
├── docs/
│   └── swagger.js
├── controllers/
│   ├── authController.js
│   ├── eventController.js
│   └── attendanceController.js
├── middlewares/
│   ├── authMiddleware.js
│   ├── roleMiddleware.js
│   ├── errorMiddleware.js
│   └── rateLimitMiddleware.js
├── models/
│   ├── userModel.js
│   ├── eventModel.js
│   └── registrationModel.js
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── eventRoutes.js
│   └── attendanceRoutes.js
├── utils/
│   ├── response.js
│   ├── qrGenerator.js
│   └── logger.js
├── logs/                 # created at runtime (error.log, combined.log)
├── .env.example
├── database.sql
├── package.json
├── README.md
└── server.js
```

## Setup Instructions

1. **Clone and install**

```bash
git clone <repo-url>
cd event-system
npm install
```

2. **Environment**

```bash
cp .env.example .env
```

Edit `.env` with your values:

- `PORT` (default 5000)
- `DB_USER`, `DB_PASSWORD`, `DB_SERVER`, `DB_NAME`
- `JWT_SECRET`
- Optional: `JWT_EXPIRES_IN`, `BCRYPT_SALT_ROUNDS`, `LOG_LEVEL`

3. **Database**

Run `database.sql` in SQL Server to create the database and tables. Registration status allowed: `registered`, `attended`, `cancelled`.

4. **Start server**

```bash
npm start
```

You should see:

```
SQL Server connected
Server running on port 5000
```

5. **Try the API**

- Open [http://localhost:5000/api/docs](http://localhost:5000/api/docs) for Swagger UI.
- Use Postman or the docs to test register, login, events, and check-in.

## Response Format

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

## Security

- Helmet sets secure HTTP headers.
- CORS is enabled (configure origins in production).
- Auth routes are rate-limited (e.g. 5 requests per minute per IP).
- Passwords are hashed with bcrypt; JWT for sessions.
- Database schema is not modified by the app; use existing tables only.
