# Post-Migration Cleanup Checklist

## Code Cleanup

### Files to Delete (Safe to Remove)

#### 1. models/eventMemberModel.js
- **Status**: Fully deprecated
- **Why**: All functionality migrated to registrations/attendances pattern
- **No imports**: Zero imports of this module remain in codebase
- **Action**: Can be safely deleted

**Content Summary** (for reference before deletion):
```javascript
// DEPRECATED - DO NOT USE
// All functions replaced by registrations + attendances tables

Functions in this file:
- createEventMember() → REPLACED BY: createRegistration()
- findEventMemberByQrCode() → REPLACED BY: findRegistrationByQrToken()
- updateAttendanceStatus() → REPLACED BY: insertAttendance() + updateRegistrationStatus()
- getEventMembers() → REPLACED BY: getRegistrationsForEvent()
```

## Database Cleanup

### Tables to Drop

**⚠️ DO NOT DROP** - The event_member and event_members tables have already been dropped from the database schema. This code migration aligns the Node.js backend with the existing database state.

If for some reason these tables still exist in your database, they should be dropped:
```sql
IF OBJECT_ID('dbo.event_members', 'U') IS NOT NULL
    DROP TABLE dbo.event_members;

IF OBJECT_ID('dbo.event_member', 'U') IS NOT NULL
    DROP TABLE dbo.event_member;
```

## Testing Before Cleanup

Before deleting eventMemberModel.js, verify:

### 1. Code References
✅ Already verified - zero active imports of eventMemberModel

### 2. Run Tests
```bash
npm test
```
Ensure all tests pass:
- attendance.test.js
- auth.test.js
- events.test.js

### 3. Manual Testing
Test these endpoints:
```bash
# Register for event
POST /events/1/register

# Check-in with QR code
POST /attendance/checkin
{ "qr_token": "..." }

# Get event attendances
GET /events/1/attendances

# Get event registrations
GET /events/1/registrations
```

### 4. Database Verification
```sql
-- Verify no references to old tables
SELECT * FROM information_schema.TABLES 
WHERE TABLE_NAME IN ('event_members', 'event_member');
-- Should return 0 results

-- Verify new tables exist
SELECT * FROM information_schema.TABLES 
WHERE TABLE_NAME IN ('registrations', 'attendances');
-- Should return 2 results
```

## Cleanup Steps

### Step 1: Verify No Active Imports
```bash
# Search for any remaining imports (should find 0)
grep -r "eventMemberModel" event-system/
grep -r "event_member" event-system/ --include="*.js" --exclude-dir=node_modules
```

✅ Already done - no active imports found

### Step 2: Ensure Tests Pass
```bash
npm test
```

### Step 3: Deploy and Monitor
After all tests pass:
1. Deploy the updated code
2. Monitor error logs for "Invalid object name" errors
3. Monitor check-in endpoint for transaction errors
4. Verify attendance records are created correctly

### Step 4: Delete Deprecated File
Once confident everything works, delete:
- `models/eventMemberModel.js`

### Step 5: Commit Changes
```bash
git add -A
git commit -m "Remove deprecated eventMemberModel - migrate to registrations/attendances schema"
```

## Verification After Deletion

After deleting eventMemberModel.js, verify:

### Build Check
```bash
npm run build
# or
npm start
# Should start without errors about missing modules
```

### Code Quality
```bash
npm run lint
# Should show no errors about undefined modules or unused imports
```

### Test Suite
```bash
npm test
# All tests should pass
```

## Rollback Plan

If issues arise after deletion:

### Step 1: Restore File
```bash
git checkout HEAD~1 models/eventMemberModel.js
```

### Step 2: Revert Code Changes
```bash
git revert HEAD
```

### Step 3: Investigate Issue
Check:
- Database connection errors
- Transaction handling
- Query syntax for SQL Server
- User permissions on attendances table

## Notes

- This migration assumes the database already has the new schema
- All migrations are backward-incompatible (event_members table is gone)
- Google Sheet integration continues to work (uses registrations data)
- Logging and audit trails are enhanced with checkin_by field
- Transaction support prevents race conditions on QR check-in

## Additional Resources

See also:
- MIGRATION_SUMMARY.md - Detailed technical migration documentation
- database.sql - Current database schema definition
- models/registrationModel.js - Refactored model with all registration logic
