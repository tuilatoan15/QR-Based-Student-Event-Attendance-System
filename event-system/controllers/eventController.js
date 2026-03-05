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
  REGISTRATION_STATUS
} = require('../models/registrationModel');
const { generateQrToken } = require('../utils/qrGenerator');
const { successResponse, errorResponse } = require('../utils/response');

const getEvents = async (req, res, next) => {
  try {
    const events = await getAllEvents();
    return successResponse(res, 200, 'Events retrieved successfully', events);
  } catch (err) {
    next(err);
  }
};

const getEventByIdHandler = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return errorResponse(res, 400, 'Invalid event id');
    }
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

    if (!title || !location || !start_time || !end_time || max_participants == null) {
      return errorResponse(res, 400, 'title, location, start_time, end_time, max_participants are required');
    }

    const maxCap = parseInt(max_participants, 10);
    if (!Number.isInteger(maxCap) || maxCap <= 0) {
      return errorResponse(res, 400, 'max_participants must be a positive integer');
    }

    const eventId = await createEvent({
      title,
      description: description || null,
      location,
      start_time,
      end_time,
      max_participants: maxCap,
      category_id: category_id || null,
      created_by: req.user.id
    });

    return successResponse(res, 201, 'Event created successfully', { id: eventId });
  } catch (err) {
    next(err);
  }
};

const updateEventHandler = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return errorResponse(res, 400, 'Invalid event id');
    }

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
    if (max_participants != null) {
      const maxCap = parseInt(max_participants, 10);
      if (!Number.isInteger(maxCap) || maxCap <= 0) {
        return errorResponse(res, 400, 'max_participants must be a positive integer');
      }
      fields.max_participants = maxCap;
    }
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
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return errorResponse(res, 400, 'Invalid event id');
    }

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
    const eventId = parseInt(req.params.id, 10);

    if (!Number.isInteger(eventId) || eventId <= 0) {
      return errorResponse(res, 400, 'Invalid event id');
    }

    const event = await getEventById(eventId);
    if (!event) {
      return errorResponse(res, 404, 'Event not found');
    }
    if (!event.is_active) {
      return errorResponse(res, 400, 'Event is not active');
    }

    const existing = await findRegistrationByUserAndEvent(userId, eventId);
    if (existing) {
      return errorResponse(res, 400, 'Already registered for this event');
    }

    const count = await countRegistrationsForEvent(eventId);
    if (count >= event.max_participants) {
      return errorResponse(res, 400, 'Event is full');
    }

    const qr_token = generateQrToken();
    const registration = await createRegistration({ user_id: userId, event_id: eventId, qr_token });

    return successResponse(res, 201, 'Registered successfully', {
      registration: { id: registration.id, event_id: eventId, user_id: userId },
      qr_token
    });
  } catch (err) {
    if (err.number === 2627 || err.number === 2601) {
      return errorResponse(res, 400, 'Already registered for this event');
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
    const eventId = parseInt(req.params.id, 10);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      return errorResponse(res, 400, 'Invalid event id');
    }
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

const getEventAttendances = async (req, res, next) => {
  try {
    const eventId = parseInt(req.params.id, 10);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      return errorResponse(res, 400, 'Invalid event id');
    }
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
  getUserEvents,
  getEventRegistrations,
  getEventAttendances
};
