# QR-Based Student Event Attendance System

Backend API for event registration and QR-based attendance check-in.

## Tech Stack

- **Node.js** + **Express.js**
- **SQL Server** (mssql)
- **JWT** authentication
- **bcrypt** password hashing
- **dotenv** environment config

## Features

- User registration & login (JWT)
- Role-based access (admin, organizer, student)
- Event CRUD (create, read, update, soft delete)
- Student event registration with unique QR token
- QR-based attendance check-in
- List user's events and event attendances

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
| POST | /api/events/:id/register | Register for event (student) |
| GET | /api/events/:id/registrations | List registrations (admin/organizer) |
| GET | /api/events/:id/attendances | List attendances (admin/organizer) |
| GET | /api/users/me/events | Current user's registered events |
| POST | /api/attendance/checkin | Check-in by QR code (admin/organizer) |

## Installation

```bash
git clone <repo-url>
cd event-system
npm install
cp .env.example .env
```

Edit `.env` with your SQL Server and JWT settings, then:

```bash
npm start
```

You should see:

```
SQL Server connected
Server running on port 5000
```

## Project Structure

```
event-system/
├── config/
│   └── db.js
├── controllers/
│   ├── authController.js
│   ├── eventController.js
│   └── attendanceController.js
├── middlewares/
│   ├── authMiddleware.js
│   ├── roleMiddleware.js
│   └── errorMiddleware.js
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
│   └── qrGenerator.js
├── .env.example
├── database.sql
├── package.json
├── README.md
└── server.js
```

## Database

Run `database.sql` in SQL Server to create the database and tables. Ensure `registrations.status` allows: `registered`, `attended`, `cancelled`.
