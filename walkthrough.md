# Pagination Implementation Walkthrough

I have successfully implemented pagination on the [EventsPage](file:///c:/Users/ASUS/Desktop/QR-Based-Student-Event-Attendance-System/web-admin/src/pages/EventsPage.tsx#7-134) so that all events can be browsed page by page instead of just fetching a maximum of 10 items.

## Changes Made

### Backend

- **[eventModel.js](file:///c:/Users/ASUS/Desktop/QR-Based-Student-Event-Attendance-System/event-system/models/eventModel.js)**: 
  - Added new functions [countAllEvents()](file:///c:/Users/ASUS/Desktop/QR-Based-Student-Event-Attendance-System/event-system/models/eventModel.js#153-160) and [countEventsByOrganizer(created_by)](file:///c:/Users/ASUS/Desktop/QR-Based-Student-Event-Attendance-System/event-system/models/eventModel.js#161-169) to query the database using `SELECT COUNT(*)` to precisely know the total number of events.
- **[eventController.js](file:///c:/Users/ASUS/Desktop/QR-Based-Student-Event-Attendance-System/event-system/controllers/eventController.js)**:
  - Updated the functions [getEvents](file:///c:/Users/ASUS/Desktop/QR-Based-Student-Event-Attendance-System/event-system/controllers/eventController.js#27-50) and [getOrganizerEvents](file:///c:/Users/ASUS/Desktop/QR-Based-Student-Event-Attendance-System/event-system/controllers/eventController.js#306-339) so they not only perform the paginated query but also call the new count functions to determine the exact total number of events. They now return `total` and `totalPages` as part of the `pagination` object in the API response.

### Frontend

- **[eventApi.ts](file:///c:/Users/ASUS/Desktop/QR-Based-Student-Event-Attendance-System/web-admin/src/api/eventApi.ts)**:
  - Added support for query parameters in [getEvents](file:///c:/Users/ASUS/Desktop/QR-Based-Student-Event-Attendance-System/event-system/controllers/eventController.js#27-50) and [getOrganizerEvents](file:///c:/Users/ASUS/Desktop/QR-Based-Student-Event-Attendance-System/event-system/controllers/eventController.js#306-339) using `{ page, limit }` to pass these details to the backend.
- **[EventsPage.tsx](file:///c:/Users/ASUS/Desktop/QR-Based-Student-Event-Attendance-System/web-admin/src/pages/EventsPage.tsx)**:
  - Set up local states for `page`, `totalPages`, and `totalEvents`.
  - Updated the API fetching logic to extract the pagination details returned by the backend and modified the headers to correctly show `totalEvents` instead of `.length`.
  - Implemented a clean, user-friendly pagination control (`Trang X / Y`, `Trước`, `Sau`) under the events table, matching the existing app design style. Changing the page number now properly re-fetches the next chunk of events. 

## Manual Validation Required

To verify this is fully working:
1. Try out the pagination controls on the `http://localhost:5173/events` page.
2. Verify that the correct page count appears at the bottom.
3. Validate that you can smoothly click "Trước" (Prev) and "Sau" (Next) to cycle through all your available events.

Enjoy the new pagination feature!
