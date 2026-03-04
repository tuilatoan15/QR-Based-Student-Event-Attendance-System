const {
  createEvent,
  getAllEvents,
  getEventById
} = require('../models/eventModel');

const createEventController = async (req, res) => {
  try {
    const { name, location, max_participants, time, description } = req.body;

    if (!name || !location || !max_participants || !time) {
      return res.status(400).json({
        message: 'name, location, max_participants and time are required'
      });
    }

    const numericMax = Number(max_participants);
    if (!Number.isInteger(numericMax) || numericMax <= 0) {
      return res.status(400).json({
        message: 'max_participants must be a positive integer'
      });
    }

    const event = await createEvent({
      name,
      location,
      max_participants: numericMax,
      time,
      description: description || null,
      created_by: req.user.id
    });

    res.status(201).json({
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error while creating event' });
  }
};

const getEventsController = async (req, res) => {
  try {
    const events = await getAllEvents();
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error while fetching events' });
  }
};

const getEventByIdController = async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await getEventById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    console.error('Get event by id error:', error);
    res.status(500).json({ message: 'Server error while fetching event' });
  }
};

module.exports = {
  createEventController,
  getEventsController,
  getEventByIdController
};

