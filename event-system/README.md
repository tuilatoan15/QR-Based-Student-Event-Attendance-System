# QR-Based Student Event Attendance Backend

Express + MongoDB Atlas backend for student registration, event management, event registration, and QR attendance check-in.

## Stack

- Node.js
- Express
- MongoDB Atlas
- Mongoose
- JWT authentication
- bcrypt password hashing

## Project Structure

```text
event-system/
├── config/
│   └── db.js
├── controllers/
│   ├── attendanceController.js
│   ├── authController.js
│   └── eventController.js
├── middlewares/
├── models/
│   ├── attendanceModel.js
│   ├── eventModel.js
│   ├── registrationModel.js
│   └── userModel.js
├── routes/
│   ├── attendanceRoutes.js
│   ├── authRoutes.js
│   └── eventRoutes.js
├── src/
│   ├── app.js
│   └── scripts/seedSampleData.js
└── server.js
```

## Environment Variables

Create `.env` from `.env.example` and set:

```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster0.mongodb.net/qr_attendance?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=change-this-secret
JWT_EXPIRES_IN=1d
BCRYPT_SALT_ROUNDS=10
CORS_ORIGIN=http://localhost:5173
```

## Install and Run

```bash
npm install
npm start
```

For sample data:

```bash
npm run seed
```

## Main APIs

- `POST /api/auth/register`
- `POST /api/auth/register-organizer`
- `POST /api/auth/login`
- `GET /api/events`
- `POST /api/events`
- `POST /api/events/:id/register`
- `GET /api/events/:id/registrations`
- `POST /api/attendance/check-in`
- `GET /api/attendance/event/:id`

## Notes

- `users`, `events`, `registrations`, and `attendances` are stored as MongoDB collections.
- Relationships are modeled with ObjectId refs and populated with Mongoose `populate()`.
- Swagger is available at `/api/docs`.
