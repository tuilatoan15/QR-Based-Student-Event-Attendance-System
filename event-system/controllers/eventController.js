const {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  softDeleteEvent,
  countRegistrationsForEvent
} = require('../models/eventModel');
const {
  createRegistration,
  findRegistrationByUserAndEvent,
  getRegistrationsByUserWithEvents,
  getRegistrationsForEvent,
  getAttendancesForEvent,
  updateRegistrationStatus,
  REGISTRATION_STATUS
} = require('../models/registrationModel');
const { generateQrToken, generateQRCodeDataURL } = require('../utils/qrGenerator');
const { successResponse, paginatedSuccessResponse, errorResponse } = require('../utils/response');
const googleSheetService = require('../services/googleSheetService');
const { createEventMember } = require('../models/eventMemberModel');
const { findUserById } = require('../models/userModel');

const getEvents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const safePage = Number.isInteger(page) && page > 0 ? page : 1;
    const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 10;
    const offset = (safePage - 1) * safeLimit;

    const events = await getAllEvents(offset, safeLimit);

    return paginatedSuccessResponse(res, 200, 'Events retrieved successfully', events, {
      page: safePage,
      limit: safeLimit
    });
  } catch (err) {
    next(err);
  }
};

const getEventByIdHandler = async (req, res, next) => {
  try {
    const id = req.params.id;
    const event = await getEventById(id);
    if (!event) {
      return errorResponse(res, 404, 'Event not found');
    }
    return successResponse(res, 200, 'Event retrieved successfully', event);
  } catch (err) {
    next(err);
  }
};

const createEventHandler = async (req, res, next) => {
  try {
    const { title, description, location, start_time, end_time, max_participants, category_id } = req.body;

    const eventId = await createEvent({
      title,
      description: description || null,
      location,
      start_time,
      end_time,
      max_participants,
      category_id: category_id || null,
      created_by: req.user.id
    });

    // Create Google Sheet for the event
    try {
      const event = await getEventById(eventId);
      const sheetInfo = await googleSheetService.createEventSheet(event);
      // You can store sheetInfo.url in the event record if needed
    } catch (sheetError) {
      console.error('Error creating Google Sheet:', sheetError);
      // Don't fail the event creation if sheet creation fails
    }

    return successResponse(res, 201, 'Event created successfully', { id: eventId });
  } catch (err) {
    next(err);
  }
};

const updateEventHandler = async (req, res, next) => {
  try {
    const id = req.params.id;

    const event = await getEventById(id);
    if (!event) {
      return errorResponse(res, 404, 'Event not found');
    }

    const { title, description, location, start_time, end_time, max_participants, category_id, is_active } = req.body;
    const fields = {};
    if (title != null) fields.title = title;
    if (description != null) fields.description = description;
    if (location != null) fields.location = location;
    if (start_time != null) fields.start_time = start_time;
    if (end_time != null) fields.end_time = end_time;
    if (max_participants != null) fields.max_participants = max_participants;
    if (category_id != null) fields.category_id = category_id;
    if (is_active !== undefined) fields.is_active = is_active;

    await updateEvent(id, fields);
    return successResponse(res, 200, 'Event updated successfully', { id });
  } catch (err) {
    next(err);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const id = req.params.id;

    const event = await getEventById(id);
    if (!event) {
      return errorResponse(res, 404, 'Event not found');
    }

    await softDeleteEvent(id);
    return successResponse(res, 200, 'Event deleted successfully', { id });
  } catch (err) {
    next(err);
  }
};

const registerForEvent = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const eventId = req.params.id;

    const event = await getEventById(eventId);
    if (!event) {
      return errorResponse(res, 404, 'Event not found');
    }
    if (!event.is_active) {
      return errorResponse(res, 409, 'Event is not active');
    }

    const existing = await findRegistrationByUserAndEvent(userId, eventId);
    if (existing && existing.status !== REGISTRATION_STATUS.CANCELLED) {
      return errorResponse(res, 409, 'Already registered for this event');
    }

    const count = await countRegistrationsForEvent(eventId);
    if (count >= event.max_participants) {
      return errorResponse(res, 409, 'Event is full');
    }

    // Get user info for event_members
    const user = await findUserById(userId);
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    let registration;
    let qr_token;
    if (existing && existing.status === REGISTRATION_STATUS.CANCELLED) {
      // Re-register by updating status
      await updateRegistrationStatus(existing.id, REGISTRATION_STATUS.REGISTERED);
      registration = { ...existing, status: REGISTRATION_STATUS.REGISTERED };
      qr_token = existing.qr_token;
    } else {
      // New registration
      qr_token = generateQrToken();
      registration = await createRegistration({ user_id: userId, event_id: eventId, qr_token });
    }

    // Create event_member record
    const eventMemberId = await createEventMember({
      event_id: eventId,
      student_id: user.student_code || `USER_${userId}`,
      student_name: user.full_name,
      email: user.email,
      qr_code: qr_token
    });

    // Add to Google Sheet
    try {
      await googleSheetService.addStudentToSheet(eventId, {
        student_id: user.student_code || `USER_${userId}`,
        student_name: user.full_name,
        email: user.email,
        qr_code: qr_token
      });
    } catch (sheetError) {
      console.error('Error adding student to Google Sheet:', sheetError);
      // Don't fail registration if sheet update fails
    }

    const qr_code = await generateQRCodeDataURL(qr_token);

    return successResponse(res, 201, 'Registered successfully', {
      registration: { id: registration.id, event_id: eventId, user_id: userId },
      qr_token: qr_token,
      qr_code
    });
  } catch (err) {
    if (err.number === 2627 || err.number === 2601) {
      return errorResponse(res, 409, 'Already registered for this event');
    }
    next(err);
  }
};

const getUserEvents = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const events = await getRegistrationsByUserWithEvents(userId);
    return successResponse(res, 200, 'User events retrieved successfully', events);
  } catch (err) {
    next(err);
  }
};

const getEventRegistrations = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const event = await getEventById(eventId);
    if (!event) {
      return errorResponse(res, 404, 'Event not found');
    }
    const list = await getRegistrationsForEvent(eventId);
    return successResponse(res, 200, 'Registrations retrieved successfully', list);
  } catch (err) {
    next(err);
  }
};

const cancelRegistration = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const registration = await findRegistrationByUserAndEvent(userId, eventId);
    if (!registration) {
      return errorResponse(res, 404, 'Registration not found');
    }

    if (registration.status === REGISTRATION_STATUS.CANCELLED) {
      return errorResponse(res, 400, 'Registration is already cancelled');
    }

    await updateRegistrationStatus(registration.id, REGISTRATION_STATUS.CANCELLED);
    return successResponse(res, 200, 'Registration cancelled successfully');
  } catch (err) {
    next(err);
  }
};

const getEventAttendances = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const event = await getEventById(eventId);
    if (!event) {
      return errorResponse(res, 404, 'Event not found');
    }
    const list = await getAttendancesForEvent(eventId);
    return successResponse(res, 200, 'Attendances retrieved successfully', list);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getEvents,
  getEventById: getEventByIdHandler,
  createEvent: createEventHandler,
  updateEvent: updateEventHandler,
  deleteEvent,
  registerForEvent,
  cancelRegistration,
  getUserEvents,
  getEventRegistrations,
  getEventAttendances
};
