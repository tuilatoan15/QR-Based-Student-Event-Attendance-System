const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { connectDB } = require('../../config/db');
const User = require('../../models/userModel');
const Event = require('../../models/eventModel');
const { Registration } = require('../../models/registrationModel');
const Attendance = require('../../models/attendanceModel');

dotenv.config();

const sqlFileArg = process.argv[2];
const sqlFilePath = sqlFileArg
  ? path.resolve(sqlFileArg)
  : path.resolve('C:\\Users\\ASUS\\Desktop\\Baomoi\\db.sql');

const readSqlFile = (filePath) => {
  const utf8 = fs.readFileSync(filePath, 'utf8');
  if (utf8.includes('INSERT [dbo].[') || utf8.includes('CREATE TABLE [dbo].[')) {
    return utf8;
  }

  const utf16 = fs.readFileSync(filePath, 'utf16le');
  return utf16;
};

const splitTopLevel = (input) => {
  const parts = [];
  let current = '';
  let inString = false;
  let depth = 0;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    const next = input[i + 1];

    if (char === "'") {
      current += char;
      if (inString && next === "'") {
        current += next;
        i += 1;
        continue;
      }
      inString = !inString;
      continue;
    }

    if (!inString) {
      if (char === '(') depth += 1;
      if (char === ')') depth -= 1;

      if (char === ',' && depth === 0) {
        parts.push(current.trim());
        current = '';
        continue;
      }
    }

    current += char;
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
};

const decodeSqlString = (value) => value.replace(/''/g, "'");

const parseSqlValue = (rawValue) => {
  const value = rawValue.trim();

  if (value === 'NULL') return null;
  if (/^CAST\(N?'(.*)' AS DateTime2\)$/i.test(value)) {
    const match = value.match(/^CAST\(N?'(.*)' AS DateTime2\)$/i);
    return match ? new Date(decodeSqlString(match[1])) : null;
  }
  if (/^N'.*'$/i.test(value)) {
    return decodeSqlString(value.slice(2, -1));
  }
  if (/^'.*'$/.test(value)) {
    return decodeSqlString(value.slice(1, -1));
  }
  if (/^-?\d+$/.test(value)) {
    return Number(value);
  }
  if (value === '0') return false;
  if (value === '1') return true;
  return value;
};

const parseInsertStatements = (sql, tableName) => {
  const rows = [];
  const lines = sql.split(/\r?\n/);
  const prefix = `INSERT [dbo].[${tableName}] (`;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith(prefix)) {
      return;
    }

    const valuesKeyword = ') VALUES (';
    const valuesIndex = trimmed.indexOf(valuesKeyword);
    if (valuesIndex === -1 || !trimmed.endsWith(')')) {
      return;
    }

    const columnsRaw = trimmed.slice(prefix.length, valuesIndex);
    const valuesRaw = trimmed.slice(valuesIndex + valuesKeyword.length, -1);

    const columns = columnsRaw
      .split(',')
      .map((item) => item.replace(/\[|\]/g, '').trim());
    const values = splitTopLevel(valuesRaw).map(parseSqlValue);
    const row = {};

    columns.forEach((column, index) => {
      row[column] = values[index];
    });

    rows.push(row);
  });

  return rows;
};

const roleNameById = (roles) =>
  new Map(roles.map((role) => [role.id, String(role.name || '').toLowerCase()]));

const buildIdMap = (rows) =>
  new Map(rows.map((row) => [row.id, new mongoose.Types.ObjectId()]));

const insertManyIfAny = async (target, docs, options = {}) => {
  if (!Array.isArray(docs) || docs.length === 0) {
    return;
  }

  await target.insertMany(docs, options);
};

const run = async () => {
  if (!fs.existsSync(sqlFilePath)) {
    throw new Error(`SQL file not found: ${sqlFilePath}`);
  }

  const sql = readSqlFile(sqlFilePath);
  const roles = parseInsertStatements(sql, 'roles');
  const users = parseInsertStatements(sql, 'users');
  const categories = parseInsertStatements(sql, 'event_categories');
  const organizerInfo = parseInsertStatements(sql, 'organizer_info');
  const events = parseInsertStatements(sql, 'events');
  const registrations = parseInsertStatements(sql, 'registrations');
  const attendances = parseInsertStatements(sql, 'attendances');
  const notifications = parseInsertStatements(sql, 'notifications');

  const roleMap = roleNameById(roles);
  const userIdMap = buildIdMap(users);
  const categoryIdMap = buildIdMap(categories);
  const eventIdMap = buildIdMap(events);
  const registrationIdMap = buildIdMap(registrations);
  const notificationIdMap = buildIdMap(notifications);
  const attendanceIdMap = buildIdMap(attendances);

  const organizerByUserId = new Map(organizerInfo.map((item) => [item.user_id, item]));

  await connectDB();

  await Promise.all([
    mongoose.connection.collection('counters').deleteMany({}),
    mongoose.connection.collection('notifications').deleteMany({}),
    mongoose.connection.collection('organizer_infos').deleteMany({}),
    mongoose.connection.collection('event_categories').deleteMany({}),
    Attendance.deleteMany({}),
    Registration.deleteMany({}),
    Event.deleteMany({}),
    User.deleteMany({}),
  ]);

  await insertManyIfAny(
    mongoose.connection.collection('event_categories'),
    categories.map((category) => ({
      _id: categoryIdMap.get(category.id),
      legacy_sql_id: category.id,
      name: category.name,
      description: category.description,
    }))
  );

  await insertManyIfAny(
    mongoose.connection.collection('users'),
    users.map((user) => {
      const organizer = organizerByUserId.get(user.id);
      return {
        _id: userIdMap.get(user.id),
        legacy_sql_id: user.id,
        full_name: user.full_name,
        email: user.email,
        password_hash: user.password_hash,
        student_code: user.student_code,
        role: roleMap.get(user.role_id) || 'student',
        is_active: Boolean(user.is_active),
        avatar: user.avatar || null,
        organizer_profile: organizer
          ? {
              organization_name: organizer.organization_name || null,
              position: organizer.position || null,
              phone: organizer.phone || null,
              bio: organizer.bio || null,
              website: organizer.website || null,
            }
          : null,
        createdAt: user.created_at || new Date(),
        updatedAt: user.updated_at || user.created_at || new Date(),
      };
    }),
    { ordered: false }
  );

  await insertManyIfAny(
    mongoose.connection.collection('organizer_infos'),
    organizerInfo.map((item) => ({
      _id: new mongoose.Types.ObjectId(),
      legacy_sql_id: item.id,
      user_id: userIdMap.get(item.user_id) || null,
      organization_name: item.organization_name || null,
      position: item.position || null,
      phone: item.phone || null,
      bio: item.bio || null,
      website: item.website || null,
      approval_status: item.approval_status || 'pending',
      approved_by: item.approved_by ? userIdMap.get(item.approved_by) || null : null,
      reject_reason: item.reject_reason || null,
      created_at: item.created_at || null,
      updated_at: item.updated_at || null,
    }))
  );

  await insertManyIfAny(
    mongoose.connection.collection('events'),
    events.map((event) => ({
      _id: eventIdMap.get(event.id),
      legacy_sql_id: event.id,
      title: event.title,
      description: event.description || '',
      location: event.location,
      start_time: event.start_time,
      end_time: event.end_time,
      max_participants: event.max_participants,
      category_id: event.category_id ? categoryIdMap.get(event.category_id) || null : null,
      created_by: userIdMap.get(event.created_by),
      google_sheet_id: event.google_sheet_id || null,
      google_sheet_name: event.google_sheet_name || null,
      images: (() => {
        if (!event.images) return [];
        if (Array.isArray(event.images)) return event.images;
        try {
          const parsed = JSON.parse(event.images);
          return Array.isArray(parsed) ? parsed : [];
        } catch (_error) {
          return [];
        }
      })(),
      is_active: event.is_active === null ? true : Boolean(event.is_active),
      createdAt: event.created_at || new Date(),
      updatedAt: event.updated_at || event.created_at || new Date(),
    })),
    { ordered: false }
  );

  await insertManyIfAny(
    mongoose.connection.collection('registrations'),
    registrations.map((registration) => ({
      _id: registrationIdMap.get(registration.id),
      legacy_sql_id: registration.id,
      user_id: userIdMap.get(registration.user_id),
      event_id: eventIdMap.get(registration.event_id),
      qr_token: registration.qr_token,
      status: registration.status || 'registered',
      registered_at: registration.registered_at || new Date(),
      createdAt: registration.registered_at || new Date(),
      updatedAt: registration.registered_at || new Date(),
    })),
    { ordered: false }
  );

  await insertManyIfAny(
    mongoose.connection.collection('attendances'),
    attendances.map((attendance) => {
      const registration = registrations.find((item) => item.id === attendance.registration_id);
      return {
        _id: attendanceIdMap.get(attendance.id),
        legacy_sql_id: attendance.id,
        registration_id: registrationIdMap.get(attendance.registration_id),
        event_id: registration ? eventIdMap.get(registration.event_id) : null,
        student_id: registration ? userIdMap.get(registration.user_id) : null,
        checked_in_by: userIdMap.get(attendance.checkin_by),
        checkin_time: attendance.checkin_time || new Date(),
      };
    }),
    { ordered: false }
  );

  await insertManyIfAny(
    mongoose.connection.collection('notifications'),
    notifications.map((notification) => ({
      _id: notificationIdMap.get(notification.id),
      legacy_sql_id: notification.id,
      user_id: userIdMap.get(notification.user_id) || null,
      title: notification.title,
      message: notification.message,
      type: notification.type || notification['type'] || null,
      is_read: Boolean(notification.is_read),
      event_id: notification.event_id ? eventIdMap.get(notification.event_id) || null : null,
      created_at: notification.created_at || null,
    }))
  );

  await insertManyIfAny(mongoose.connection.collection('counters'), [
    { _id: 'users', seq: users.reduce((max, item) => Math.max(max, item.id || 0), 0) },
    { _id: 'events', seq: events.reduce((max, item) => Math.max(max, item.id || 0), 0) },
    {
      _id: 'registrations',
      seq: registrations.reduce((max, item) => Math.max(max, item.id || 0), 0),
    },
    {
      _id: 'attendances',
      seq: attendances.reduce((max, item) => Math.max(max, item.id || 0), 0),
    },
    {
      _id: 'notifications',
      seq: notifications.reduce((max, item) => Math.max(max, item.id || 0), 0),
    },
    {
      _id: 'event_categories',
      seq: categories.reduce((max, item) => Math.max(max, item.id || 0), 0),
    },
  ]);

  console.log('SQL dump imported to MongoDB successfully.');
  console.log({
    users: users.length,
    categories: categories.length,
    organizer_info: organizerInfo.length,
    events: events.length,
    registrations: registrations.length,
    attendances: attendances.length,
    notifications: notifications.length,
    sqlFilePath,
  });
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
