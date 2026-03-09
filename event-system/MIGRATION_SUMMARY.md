# Database Schema Migration Summary

## Overview
Successfully migrated backend code from using non-existent `event_member` and `event_members` tables to the new normalized schema using `registrations` and `attendances` tables.

## Problem Addressed
The backend code referenced the following tables that no longer exist in the database:
- `event_member`
- `event_members`

This caused runtime errors:
- `Invalid object name 'event_member'`
- `Invalid object name 'event_members'`

## New Database Schema
The application now uses the following tables for event management:

| Table | Purpose |
|-------|---------|
| `registrations` | Stores event registrations with qr_token, status, and user details |
| `attendances` | Stores QR check-in records with checkin_time and checkin_by |
| `users` | User profile information |
| `events` | Event details |
| `registrations` | Registration records (replaces event_members functionality) |

## Changes Made

### 1. attendanceController.js
**Location**: `controllers/attendanceController.js`

**Changes**:
- ✅ Removed import of `eventMemberModel` functions
- ✅ Refactored `checkIn()` function to use registrations and attendances tables
- ✅ Implemented proper transaction handling for atomicity
- ✅ Updated QR code check-in logic:
  1. Find registration by `qr_token` (instead of looking in event_members)
  2. Check registration status and attendance existence
  3. Insert attendance record with `checkin_by` (admin/organizer ID)
  4. Update registration status to 'attended'
  5. All within a SQL transaction for data consistency

**API Endpoint**: `POST /attendance/checkin`

**Request Body**:
```json
{
  "qr_token": "<qr_token_from_registration>"
}
// OR
{
  "qr_code": "<qr_code_from_registration>"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Check-in successful",
  "data": {
    "registration_id": 123,
    "student_name": "Nguyen Van A",
    "event_id": 1,
    "checked_in_by": 5,
    "check_in_time": "2026-03-10T10:30:45.123Z"
  }
}
```

### 2. eventController.js
**Location**: `controllers/eventController.js`

**Changes**:
- ✅ Removed import of `createEventMember` from eventMemberModel
- ✅ Refactored `registerForEvent()` function:
  - Removed createEventMember() call
  - Student data is now only stored in registrations table
  - Registration with qr_token is the source of truth
  - Google Sheet integration remains unchanged (uses registration data)

**API Endpoints Updated**:

#### POST /events/:id/register
- Creates registration entry (no longer creates event_member)
- Returns qr_token and qr_code for scanning

#### GET /events/:id/registrations
- Lists all registrations for an event
- Uses registrations table with user joins

#### GET /events/:id/attendances
- Lists all attendances with full details from registrations and attendances tables

### 3. registrationModel.js
**Location**: `models/registrationModel.js`

**Status**: No changes needed - already has all required functions:
- ✅ `findRegistrationByQrToken()` - finds registration by QR token
- ✅ `hasAttendanceForRegistration()` - checks if already attended
- ✅ `insertAttendance()` - inserts attendance record
- ✅ `updateRegistrationStatus()` - updates registration status
- ✅ `getAttendancesForEvent()` - retrieves attendances for event

### 4. Deprecated Files

#### eventMemberModel.js
**Status**: Deprecated - No longer imported or used
- ⚠️ This file can be safely deleted
- All functionality has been migrated to use registrations and attendances tables
- No imports of this module remain in the codebase

**File Path**: `models/eventMemberModel.js`

**Deprecated Functions**:
- `createEventMember()` - replaced by createRegistration()
- `findEventMemberByQrCode()` - replaced by findRegistrationByQrToken()
- `updateAttendanceStatus()` - replaced by insertAttendance() + updateRegistrationStatus()
- `getEventMembers()` - replaced by getRegistrationsForEvent()

## Data Flow Comparison

### OLD FLOW (event_member table)
```
1. POST /events/:id/register
   ├─ Create registration
   ├─ Create event_member (stored name, email, qr_code)
   └─ Return qr_code
2. POST /attendance/checkin (with qr_code)
   ├─ Find in event_members table
   ├─ Update attendance_status field in event_members
   └─ Return success
```

### NEW FLOW (registrations + attendances)
```
1. POST /events/:id/register
   ├─ Create registration (stores user_id, event_id, qr_token, status)
   └─ Return qr_token
2. POST /attendance/checkin (with qr_token)
   ├─ Find registration by qr_token (joined with users/events)
   ├─ Check registration status and hasAttendance
   ├─ Insert into attendances (registration_id, checkin_by, checkin_time)
   ├─ Update registration.status = 'attended'
   └─ Return success (within transaction)
```

## Verification

### Imports Removed
```javascript
// REMOVED from eventController.js
const { createEventMember } = require('../models/eventMemberModel');

// REMOVED from attendanceController.js
const { findEventMemberByQrCode, updateAttendanceStatus } = require('../models/eventMemberModel');
```

### Code References Removed
```javascript
// REMOVED: createEventMember() call in registerForEvent()
const eventMemberId = await createEventMember({...});

// REMOVED: findEventMemberByQrCode() calls
const eventMember = await findEventMemberByQrCode(qr_token);

// REMOVED: updateAttendanceStatus() calls
await updateAttendanceStatus(eventMember.id, 1, checkin_time);
```

### Database Query Verification
All SQL queries updated to use correct table names:
- ✅ `registrations` table for storing registrations
- ✅ `attendances` table for storing check-ins
- ✅ Proper JOINs with users and events tables
- ✅ Transaction support for QR check-in atomicity

## Testing Checklist

### 1. User Registration
- [ ] POST /auth/register - creates user
- [ ] POST /events/:id/register - creates registration with qr_token
- [ ] Verify registration entry in database
- [ ] Verify qr_token is generated correctly

### 2. QR Code Check-in
- [ ] POST /attendance/checkin with valid qr_token
- [ ] Verify attendance record created
- [ ] Verify registration.status = 'attended'
- [ ] Verify transaction rollback on error

### 3. Edge Cases
- [ ] Check-in with invalid qr_token → 404
- [ ] Double check-in → 409 (Already checked in)
- [ ] Check-in after registration cancelled → appropriate error
- [ ] Google Sheet update failure doesn't fail check-in

### 4. List Endpoints
- [ ] GET /events/:id/registrations → returns all registrations
- [ ] GET /events/:id/attendances → returns all attendances with details
- [ ] GET /events/:id/participants → works correctly with new schema

### 5. Database
- [ ] No references to event_member table
- [ ] All transactions execute atomically
- [ ] Foreign key constraints maintained

## SQL Queries Reference

### Check QR Token and Get Registration Details
```sql
SELECT r.*, u.full_name, u.email, e.title AS event_title, e.is_active AS event_is_active
FROM registrations r
JOIN users u ON r.user_id = u.id
JOIN events e ON r.event_id = e.id
WHERE r.qr_token = @qrToken
```

### Insert Attendance Record
```sql
INSERT INTO attendances (registration_id, checkin_time, checkin_by)
OUTPUT INSERTED.checkin_time AS checkin_time
VALUES (@registration_id, SYSUTCDATETIME(), @checkin_by)
```

### Update Registration Status
```sql
UPDATE registrations
SET status = @status
WHERE id = @registration_id
```

### Get Event Participants with Attendance
```sql
SELECT 
  u.full_name,
  u.email,
  r.qr_token,
  r.status,
  a.checkin_time
FROM registrations r
JOIN users u ON r.user_id = u.id
LEFT JOIN attendances a ON a.registration_id = r.id
WHERE r.event_id = @event_id
ORDER BY r.registered_at ASC
```

## Important Notes

1. **Transaction Safety**: QR check-in now uses SQL transactions to ensure atomicity - both attendance insertion and registration update must succeed together.

2. **User Data Source**: Student information (name, email, student_code) is now only stored in the `users` table, referenced through `registrations.user_id`. No duplication.

3. **QR Token**: The `qr_token` is generated once during registration and stored in the registrations table. It cannot be regenerated or changed.

4. **Multiple Check-ins Prevention**: Prevented by checking:
   - `registrations.status = 'attended'`
   - Existence of attendance record via `hasAttendanceForRegistration()`

5. **Google Sheets Integration**: Still functional - uses data from users table joined through registrations.

6. **Audit Trail**: All check-ins are logged with `checkin_by` (admin/organizer ID) and `checkin_time` for audit purposes.

## Rollback Information

If needed to revert, the changes were made to:
1. `controllers/eventController.js` - registerForEvent() function
2. `controllers/attendanceController.js` - checkIn() function
3. Imports in both files (removed eventMemberModel references)

All changes are isolated to these files. The database schema was already refactored.
