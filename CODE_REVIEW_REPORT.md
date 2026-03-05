# Full Professional Code Review Report

**Repository:** QR-Based-Student-Event-Attendance-System  
**Tech Stack:** Node.js, Express, SQL Server, JWT, QR Code  
**Reviewer Role:** Senior Backend Engineer  
**Purpose:** Backend Intern position application evaluation  

---

## 1. PROJECT STRUCTURE REVIEW

### Current Structure

```
QR-Based-Student-Event-Attendance-System/
└── event-system/
    ├── config/          → db.js
    ├── docs/            → swagger.js
    ├── controllers/     → authController, eventController, attendanceController
    ├── middlewares/     → authMiddleware, roleMiddleware, errorMiddleware, rateLimitMiddleware
    ├── models/          → userModel, eventModel, registrationModel
    ├── routes/          → authRoutes, userRoutes, eventRoutes, attendanceRoutes
    ├── utils/           → response, qrGenerator, logger, generateQR.js, generateQrToken.js
    ├── database.sql
    ├── server.js
    ├── package.json
    └── README.md
```

### What Is Good

- **Separation of concerns:** Controllers, routes, models, and middlewares are clearly separated.
- **Config isolated:** Database configuration lives in `config/db.js`.
- **Centralized response helpers:** `utils/response.js` provides consistent API responses.
- **API documentation:** Swagger is set up under `docs/`.
- **Security and observability:** Helmet, rate limiting, and Winston logging are present.

### What Should Be Improved

- **Application lives in a subfolder:** The actual app is under `event-system/`. For a single backend repo, the backend should typically live at the root or in a clearly named folder (e.g. `backend/`). The repo name suggests one product; the structure should reflect that.
- **No `src/` wrapper:** Many teams use a top-level `src/` (or `app/`) so that entry point (`server.js` or `index.js`) stays at root and all application code is under `src/`. Not mandatory but improves clarity.
- **Route order in eventRoutes:** Public routes (`GET /`, `GET /:id`) are defined first, which is correct. Ensure that more specific routes (e.g. `/:id/registrations`) never get shadowed by `/:id` (they are not, but ordering should be documented or enforced with a small router split).

### Missing Folders / Conventions

| Missing | Recommendation |
|--------|-----------------|
| **services/** | Business logic that coordinates multiple models (e.g. “register for event” = event + registration + QR) should live in a service layer. Controllers would call services, not models directly. |
| **repositories/** | Data access is currently in `models/`. Splitting into repositories (raw DB) and models (entities/DTOs) is a common backend practice and improves testability. |
| **validators/** or **middlewares/validation** | Request validation (e.g. Joi, express-validator) should be centralized in validators or validation middlewares, not only inline in controllers. |
| **constants/** | Magic strings (e.g. role names, registration statuses) can live in a `constants/` or `config/constants.js` to avoid duplication. |
| **tests/** | No `tests/`, `__tests__/`, or `*.test.js` present. For an intern application, at least a few unit or integration tests would strengthen the repo. |

### Suggested Target Structure (for growth)

```
event-system/
├── src/
│   ├── config/          # db, constants
│   ├── controllers/
│   ├── services/        # NEW: orchestration logic
│   ├── repositories/    # optional: if you split from models
│   ├── models/          # or keep as data access layer
│   ├── routes/
│   ├── middlewares/
│   ├── validators/      # NEW
│   └── utils/
├── docs/
├── tests/               # NEW
├── server.js
├── package.json
└── README.md
```

---

## 2. CODE QUALITY REVIEW

### Bad Naming

| Location | Issue | Suggestion |
|----------|--------|------------|
| `eventController.js` | `getEventByIdHandler` exported as `getEventById` | Use one name: e.g. keep handler as `getEventById` everywhere. |
| `attendanceController.js` | `bodyQrToken`, `raw` for the same input | Use a single name, e.g. `qrTokenInput`, and validate once. |
| `registrationModel.js` | `insertAttendance` exists but check-in uses raw SQL in controller | Either use `insertAttendance` from the controller or rename to reflect “check-in” (e.g. `createCheckIn`). |
| Utils | `generateQR.js` and `generateQrToken.js` duplicate `qrGenerator.js` | Remove unused files; keep only `qrGenerator.js` (which is the one used). |

### Duplicated Logic

1. **ID parsing and validation** (eventController, attendanceController):  
   Repeated pattern: `const id = parseInt(req.params.id, 10); if (!Number.isInteger(id) || id <= 0) return errorResponse(res, 400, 'Invalid event id');`  
   **Fix:** Create a middleware or shared validator, e.g. `validateEventId`, and use it on routes with `:id`.

   ```javascript
   // middlewares/validateParams.js
   const validateEventId = (req, res, next) => {
     const id = parseInt(req.params.id, 10);
     if (!Number.isInteger(id) || id <= 0) {
       return errorResponse(res, 400, 'Invalid event id');
     }
     req.params.id = id;
     next();
   };
   ```

2. **Event existence check:**  
   Many handlers do `getEventById(id)` then `if (!event) return errorResponse(res, 404, 'Event not found')`.  
   **Fix:** Consider middleware `requireEvent` that loads `req.event` and returns 404 if not found, so controllers only deal with business logic.

3. **QR token generation:**  
   `generateQR.js` and `generateQrToken.js` are redundant with `qrGenerator.js`.  
   **Fix:** Delete `utils/generateQR.js` and `utils/generateQrToken.js`; use only `qrGenerator.js`.

### Missing Error Handling

- **authController:**  
  - No explicit handling for invalid `student_code` format or length.  
  - `getRoleIdByName('student')` failing returns 500 but no log; add `logError` or similar for debugging.

- **eventController:**  
  - `createEvent` / `updateEvent`: `start_time` and `end_time` are passed to `new Date(...)` without validation; invalid dates can cause DB or runtime errors. Validate (e.g. `!isNaN(new Date(start_time).getTime())`) and return 400 with a clear message.

- **attendanceController:**  
  - Catches `err.number === 2627 || err.number === 2601` (SQL Server unique/constraint) in `registerForEvent`; good. But the same controller’s transaction only does `next(txErr)` on rollback; ensure the error is logged in `errorMiddleware` (it is via `logError`). No issue here, but ensure all DB errors are consistently passed to the global handler.

- **config/db.js:**  
  - Connection failure throws; if `server.js` doesn’t handle process-level rejections, the process can exit without a clear message. Add `process.on('unhandledRejection', ...)` in `server.js` or handle `poolPromise` rejection at startup.

### Inconsistent async/await

- All controller and model functions use async/await consistently; no callback-style mixing.  
- One improvement: in `attendanceController.checkIn`, the inner `try/catch` for the transaction could rethrow after rollback so the outer `catch` and `errorMiddleware` receive the same error (currently `next(txErr)` is correct).

### Improper Status Codes

| Location | Current | Suggestion |
|----------|---------|------------|
| `deleteEvent` | 200 | For “successful deletion” (soft delete), 200 is acceptable. Alternatively 204 No Content if the API convention is to return no body. |
| Duplicate registration | 400 | 409 Conflict is more RESTful for “already registered”. |
| “Event is full” | 400 | 409 Conflict or 422 Unprocessable Entity better express “business rule violation”. |
| “Already checked in” | 400 | 409 Conflict. |
| Invalid/expired token | 401 | Correct. |
| Forbidden (wrong role) | 403 | Correct. |

### Missing Validation

- **Auth:**  
  - No email format validation.  
  - No password strength (length, complexity).  
  - Add express-validator or Joi and validate before calling the controller logic.

- **Events:**  
  - `start_time` < `end_time` not validated.  
  - `title` / `location` length not validated (DB has limits; enforce in API to return clear 400).

- **Check-in:**  
  - `qr_token` is trimmed and checked for non-empty string; good. Optional: validate UUID format if all tokens are UUIDs.

### Messy Controller Logic

- **eventController:**  
  - `updateEventHandler` builds a `fields` object with many conditionals; consider a small helper or schema that defines updatable fields and types.  
  - `registerForEvent` mixes validation, event fetch, capacity check, registration creation, and QR generation. Moving “register user for event” to a **service** (e.g. `registrationService.registerForEvent(userId, eventId)`) would keep the controller thin and improve testability.

- **attendanceController:**  
  - Check-in logic (find registration, validate status, insert attendance, update registration) could live in a **service** (e.g. `attendanceService.checkIn(qrToken, checkinByUserId)`); controller would only parse request, call service, and send response.

---

## 3. SECURITY REVIEW

### JWT

- **Usage:** Token is signed with `process.env.JWT_SECRET` and `expiresIn`; no refresh flow in code (DB has `refresh_tokens` table but it’s unused).  
- **Payload:** Contains `id`, `email`, `role`. No sensitive data.  
- **Risks:**  
  - If `JWT_SECRET` is missing, `jwt.sign`/`jwt.verify` can throw or behave unsafely. Fail fast at startup if `JWT_SECRET` is not set.  
  - No token revocation; consider short-lived access token + refresh token if required later.

**Fix (startup):**

```javascript
// server.js or config
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  throw new Error('JWT_SECRET must be set and at least 16 characters');
}
```

### Authentication Middleware

- **authMiddleware:** Checks `Authorization: Bearer <token>`, verifies JWT, sets `req.user`. Used on all protected routes (users/me, events write, attendance check-in).  
- **roleMiddleware:** Used correctly after auth on event and attendance routes.  
- **Gap:** `GET /api/events` and `GET /api/events/:id` are intentionally public; no issue.

### SQL Injection

- All DB access uses parameterized queries (`pool.request().input(...).query(...)`). No string concatenation of user input into SQL.  
- **Verdict:** No SQL injection risk found.

### Input Validation

- Controllers do minimal checks (required fields, types).  
- **Missing:** Schema validation (length, format, range). A single place (validators or validation middleware) with allowlists and sanitization would reduce risk of malformed or oversized input.

### Rate Limiting

- Only auth routes use `authLimiter` (e.g. 5 req/min).  
- **Gap:** No global rate limit; public endpoints like `GET /api/events` are unlimited. Recommend a general limiter (e.g. 100 req/15 min per IP) and keep stricter limit on auth.

**Example:**

```javascript
const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api', generalLimiter);
```

### Sensitive Data in Code

- No secrets in repo; `.env` is gitignored, `.env.example` has placeholders.  
- **.env.example:** `JWT_SECRET=supersecretkey` is clearly a placeholder; README should state “use a long random secret in production”.  
- **Logs:** Avoid logging request bodies that might contain passwords; current code doesn’t log body, which is good.

---

## 4. API DESIGN REVIEW

### REST Conventions

| Aspect | Status | Notes |
|--------|--------|-------|
| Resource names (nouns) | OK | `events`, `users`, `attendance` |
| HTTP methods | OK | GET list/detail, POST create, PUT update, DELETE soft-delete |
| Status codes | Partial | Prefer 409 for conflicts, 204 for delete without body if desired |
| Idempotency | OK | GET/PUT/DELETE are idempotent; POST for register/check-in is not, which is acceptable |

### HTTP Methods and Routes

- **POST /api/events/:id/register** – Correct (creating a registration).  
- **POST /api/attendance/checkin** – Correct (performing check-in).  
- **GET /api/users/me/events** – Correct (current user’s events).  
- **GET /api/events/:id/registrations** and **GET /api/events/:id/attendances** – Correct as sub-resources.

### Route Naming

- Clear and consistent: `/api/auth`, `/api/users`, `/api/events`, `/api/attendance`.  
- Minor: “checkin” could be “check-in” in URL; both are used in practice; consistency with frontend matters more.

### Response Consistency

- **successResponse:** `{ success: true, message, data }`.  
- **errorResponse:** `{ success: false, message }` (no `data`).  
- **Suggestion:** Include a stable `errorCode` or `code` for clients (e.g. `INVALID_QR`, `EVENT_FULL`) and optionally `details` for validation errors.  
- **Pagination:** `GET /api/events` returns all active events; for production, add `?page=&limit=` and return `{ data: [], pagination: { total, page, limit } }`.

### Suggested Improvements

1. **Versioning:** Consider `/api/v1/...` for future compatibility.  
2. **Health check:** Add `GET /health` or `GET /api/health` (no auth) for load balancers.  
3. **Pagination:** Add to list endpoints (events, registrations, attendances).  
4. **Error payload:** Standardize `{ success: false, message, code?, details? }`.

---

## 5. DATABASE DESIGN REVIEW

### Schema Overview (database.sql)

- **Tables:** roles, users, event_categories, events, registrations, attendances, refresh_tokens, audit_logs.  
- **Relations:** FKs from users → roles, events → categories & created_by, registrations → users & events, attendances → registrations & checkin_by.  
- **Constraints:** UNIQUE on users.email, registrations.(user_id, event_id), attendances.registration_id; CHECK on registrations.status and events.max_participants.

### Normalization

- Tables are in 3NF; no redundant attributes.  
- `refresh_tokens` and `audit_logs` exist but are unused in the app; either implement or document as “reserved for future use”.

### Foreign Keys

- All FKs defined; ON DELETE CASCADE on registrations (user, event) and attendances (registration).  
- **Note:** Deleting a user cascades to their registrations; deleting an event cascades to registrations and attendances. This is consistent with “soft delete” for events (is_active=0) and avoids orphaning data.

### Indexes

- Present: `idx_users_email`, `idx_events_start_time`, `idx_registrations_event`, `idx_registrations_user`.  
- **Suggestions:**  
  - `registrations.qr_token` is used in `findRegistrationByQrToken`; add `CREATE UNIQUE INDEX idx_registrations_qr_token ON registrations(qr_token);` (or rely on UNIQUE constraint if it already creates an index; in SQL Server, UNIQUE creates an index).  
  - Consider index on `attendances(checkin_by)` or `attendances(registration_id)` if not already covered (registration_id is UNIQUE, so index exists).  
  - For “list attendances for event”, the query joins attendances → registrations and filters by event_id; index on `registrations(event_id)` exists; good.

### Naming Conventions

- Tables: plural (users, events, registrations, attendances).  
- Columns: snake_case (full_name, student_code, start_time, checkin_time).  
- Consistent; no changes required. Optional: align with team (e.g. some use PascalCase for DB; current choice is fine).

### Additional Suggestions

- **Soft delete for users:** Add `deleted_at` or `is_active` (already have `is_active`) and avoid hard-deleting users if you need audit trail.  
- **events:** Already have `is_active` for soft delete; good.  
- **Timestamps:** `created_at`/`updated_at` on users; consider `updated_at` on events and registrations for auditing.

---

## 6. README REVIEW

The current README is clear and covers setup, API list, and response format. For a **recruiter-focused** version, it should be expanded with: project title, description, tech stack, architecture, database overview, API documentation summary, how to run, example requests, and future improvements.  

The README has been rewritten in **event-system/README.md** to include all of the above in a single, recruiter-ready document.

---

## 7. COMMIT HISTORY REVIEW

### Sample Recent Commits

```
a0d80d2 upgrade backend: swagger, qr checkin, logger, rate limit
dd27252 refactor: clean project structure, fix registrations status constraint, complete REST APIs and middleware
3cef5b2 Merge pull request #6 from ...
...
0e9191d chore: initialize backend project with express server, database config and strict gitignore
```

### What’s Good

- Some commits use prefixes (`feat`, `fix`, `chore`, `refactor`).  
- Merge commits indicate PR-based workflow.

### Suggested Convention (Conventional Commits)

Use a consistent format: `type(scope): description`.

| Type | Use for |
|------|--------|
| **feat** | New feature |
| **fix** | Bug fix |
| **refactor** | Code change that neither fixes a bug nor adds a feature |
| **docs** | Documentation only |
| **chore** | Build, tooling, deps |
| **test** | Adding or updating tests |

### Examples of Better Messages

- Instead of: `upgrade backend: swagger, qr checkin, logger, rate limit`  
  Prefer: `feat(api): add Swagger docs, QR check-in, Winston logger, and auth rate limiting`

- Instead of: `refactor: clean project structure, fix registrations status constraint, complete REST APIs and middleware`  
  Prefer:  
  - `refactor: reorganize project structure and REST API routes`  
  - `fix(db): add registrations status constraint`  
  - `feat(api): complete event and attendance REST endpoints and middleware`  
  (Or one commit per logical change.)

- Good examples already:  
  - `feat: implement full RESTful API with auth, roles, QR and SQL Server integration`  
  - `chore: initialize backend project with express server, database config and strict gitignore`

### Scope Examples

- `feat(auth): add rate limiting to login and register`
- `fix(attendance): prevent duplicate check-in for same registration`
- `docs(readme): add API examples and architecture section`

---

## 8. INTERN LEVEL EVALUATION

### Is this repository strong enough for a Backend Intern application?

**Yes, with caveats.** It demonstrates:

- Working REST API with Express and SQL Server.  
- JWT auth and role-based access.  
- Parameterized queries and structured responses.  
- Security awareness (Helmet, bcrypt, rate limiting).  
- API documentation (Swagger) and logging.  
- Clear separation of routes, controllers, and models.

For an **intern** role, this shows the candidate can build a small backend end-to-end and follow common patterns.

### What would make it stronger?

1. **Tests:** Even a few tests (e.g. authController register/login, one event endpoint) would show testing mindset.  
2. **Validation layer:** Dedicated validators or middleware (e.g. express-validator) instead of ad-hoc checks.  
3. **Service layer:** Move orchestration out of controllers into services.  
4. **Cleanup:** Remove dead code (generateQR.js, generateQrToken.js).  
5. **Error codes and pagination:** Small, professional touches that recruiters notice.  
6. **Commit discipline:** Consistent conventional commits and smaller, focused PRs.

---

## 9. PRIORITY FIX LIST

### CRITICAL FIXES

1. **Fail fast if JWT_SECRET is missing or weak** in production (server startup check).  
2. **Validate date fields** for events (`start_time`, `end_time`); ensure `start_time < end_time` and return 400 when invalid.  
3. **Handle DB connection failure** explicitly (e.g. log and exit with code 1, or `process.on('unhandledRejection')`).  
4. **Ensure no sensitive data in logs** (already the case; keep it that way when adding more logging).

### IMPORTANT IMPROVEMENTS

5. **Add request validation** (e.g. express-validator or Joi) for auth and event payloads.  
6. **Use 409 Conflict** for “already registered”, “already checked in”, “event full”.  
7. **Add a global (or /api) rate limiter** in addition to auth-specific limiter.  
8. **Remove dead code:** delete `utils/generateQR.js` and `utils/generateQrToken.js`.  
9. **Extract repeated ID validation** into middleware (e.g. validateEventId).  
10. **README:** Replace with recruiter-oriented README (see rewritten README below).

### NICE TO HAVE

11. **Service layer** for registration and attendance flows.  
12. **Pagination** on list endpoints (events, registrations, attendances).  
13. **Health endpoint** `GET /health` or `GET /api/health`.  
14. **API versioning** (`/api/v1/...`).  
15. **Unit or integration tests** for at least auth and one event flow.  
16. **Structured error codes** in API responses (`code: 'EVENT_FULL'`).  
17. **Use `insertAttendance` and `updateRegistrationStatus`** from registrationModel in attendanceController instead of raw SQL in controller (or move transaction into model/service).

---

*End of Code Review Report*
