const fs = require('fs');
const file = 'c:\\Users\\ASUS\\Desktop\\QR-Based-Student-Event-Attendance-System\\web-admin\\src\\pages\\EventsPage.tsx';
let txt = fs.readFileSync(file, 'utf8');
txt = txt.replace('await eventApi.getOrganizerEvents({ page, limit })', 'await eventApi.getOrganizerEvents({ page, limit, search: debouncedSearch })');
txt = txt.replace('await eventApi.getEvents({ page, limit })', 'await eventApi.getEvents({ page, limit, search: debouncedSearch })');
fs.writeFileSync(file, txt);
console.log('Update success');
