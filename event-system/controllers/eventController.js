const {
  createEvent,
  getAllEvents,
  getEventById,
  getEventsByOrganizer,
  getEventParticipants: getEventParticipantsModel,
  updateEvent,
  softDeleteEvent,
  countRegistrationsForEvent,
  countAllEvents,
  countEventsByOrganizer
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
const qrService = require('../services/qrService');
const { successResponse, paginatedSuccessResponse, errorResponse } = require('../utils/response');
const googleSheetService = require('../services/googleSheetService');
const { findUserById } = require('../models/userModel');

const getEvents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const safePage = Number.isInteger(page) && page > 0 ? page : 1;
    const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 10;
    const offset = (safePage - 1) * safeLimit;

    const events = await getAllEvents(offset, safeLimit);
    const total = await countAllEvents();
    const totalPages = Math.ceil(total / safeLimit);

    return paginatedSuccessResponse(res, 200, 'Events retrieved successfully', events, {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages
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

    // Create Google Sheet first
    let sheetInfo = null;
    try {
      // We'll create the sheet after getting the event ID, so for now just prepare
      // The sheet will be created after the event is inserted
    } catch (sheetError) {
      console.error('Error preparing Google Sheet:', sheetError);
      // Continue with event creation even if sheet fails
    }

    // Create event in database
    const eventId = await createEvent({
      title,
      description: description || null,
      location,
      start_time,
      end_time,
      max_participants,
      category_id: category_id || null,
      created_by: req.user.id,
      google_sheet_id: null, // Will update after sheet creation
      google_sheet_name: null // Will update after sheet creation
    });

    // Now create the Google Sheet with the event ID
    try {
      sheetInfo = await googleSheetService.createEventSheet(title, eventId);

      // Update the event with Google Sheet information
      await updateEvent(eventId, {
        google_sheet_id: sheetInfo.sheetId,
        google_sheet_name: sheetInfo.sheetName
      });
    } catch (sheetError) {
      console.error('Error creating Google Sheet:', sheetError);
      // Event is created but without Google Sheet - could be updated later
    }

    const response = {
      id: eventId,
      title,
      description,
      location,
      start_time,
      end_time,
      max_participants,
      category_id,
      created_by: req.user.id
    };

    if (sheetInfo) {
      response.google_sheet = {
        id: sheetInfo.sheetId,
        name: sheetInfo.sheetName,
        url: sheetInfo.url
      };
    }

    return successResponse(res, 201, 'Event created successfully', response);
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

    // Get user info for Google Sheet
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
      // New registration - registration data is stored in registrations table
      qr_token = qrService.generateQrToken();
      registration = await createRegistration({ user_id: userId, event_id: eventId, qr_token });
    }

    // Add to Google Sheet (user info is now only stored with registration, not in a separate event_members table)
    try {
      if (event.google_sheet_name) {
        await googleSheetService.addStudentToSheet(event.google_sheet_name, {
          student_name: user.full_name,
          student_code: user.student_code || '',
          email: user.email,
          qr_token: qr_token
        });
      }
    } catch (sheetError) {
      console.error('Error adding student to Google Sheet:', sheetError);
      // Don't fail registration if sheet update fails
    }

    const qr_code = await qrService.generateQRCodeDataURL(qr_token);

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

const getOrganizerEvents = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const safePage = Number.isInteger(page) && page > 0 ? page : 1;
    const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 10;
    const offset = (safePage - 1) * safeLimit;

    let events;
    let total = 0;
    if (req.user.role === 'admin') {
      // Admins can see all events
      events = await getAllEvents(offset, safeLimit);
      total = await countAllEvents();
    } else {
      // Organizers see only their own events
      events = await getEventsByOrganizer(req.user.id, offset, safeLimit);
      total = await countEventsByOrganizer(req.user.id);
    }

    const totalPages = Math.ceil(total / safeLimit);

    return paginatedSuccessResponse(res, 200, 'Events retrieved successfully', events, {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages
    });
  } catch (err) {
    next(err);
  }
};

const getEventParticipants = async (req, res, next) => {
  try {
    const eventId = req.params.id;

    // Check if user is the organizer of this event or admin
    const event = await getEventById(eventId);
    if (!event) {
      return errorResponse(res, 404, 'Event not found');
    }

    if (req.user.role !== 'admin' && event.created_by !== req.user.id) {
      return errorResponse(res, 403, 'Access denied: You can only view participants of your own events');
    }

    const participants = await getEventParticipantsModel(eventId);
    return successResponse(res, 200, 'Event participants retrieved successfully', participants);
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
  getOrganizerEvents,
  getEventParticipants
};
