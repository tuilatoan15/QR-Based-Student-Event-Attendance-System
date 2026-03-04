const {
  createRegistration,
  findRegistrationByUserAndEvent,
  findRegistrationByQRCode,
  updateRegistrationStatus,
  getRegistrationsByUserWithEvents
} = require('../models/registrationModel');

const {
  getEventById,
  countRegistrationsForEvent
} = require('../models/eventModel');

const generateQRCode = require('../utils/generateQR');

const registerForEventController = async (req, res) => {
  try {
    const userId = req.user.id;
    const { event_id } = req.body;

    if (!event_id) {
      return res.status(400).json({ message: 'event_id is required' });
    }

    const event = await getEventById(event_id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const existingRegistration = await findRegistrationByUserAndEvent(userId, event_id);
    if (existingRegistration) {
      return res.status(409).json({ message: 'You are already registered for this event' });
    }

    const currentCount = await countRegistrationsForEvent(event_id);
    if (currentCount >= event.max_participants) {
      return res.status(400).json({ message: 'Event is full. No more registrations allowed' });
    }

    const qrCode = generateQRCode();

    const registration = await createRegistration({
      user_id: userId,
      event_id,
      qr_code: qrCode
    });

    res.status(201).json({
      message: 'Registered for event successfully',
      registration
    });
  } catch (error) {
    console.error('Register for event error:', error);
    // SQL Server unique constraint violation
    if (error.number === 2627 || error.number === 2601) {
      return res.status(409).json({ message: 'You are already registered for this event' });
    }
    res.status(500).json({ message: 'Server error while registering for event' });
  }
};

const getMyEventsController = async (req, res) => {
  try {
    const userId = req.user.id;
    const registrations = await getRegistrationsByUserWithEvents(userId);
    res.json(registrations);
  } catch (error) {
    console.error('Get my events error:', error);
    res.status(500).json({ message: 'Server error while fetching your events' });
  }
};

const checkInController = async (req, res) => {
  try {
    const { qr_code } = req.body;

    if (!qr_code) {
      return res.status(400).json({ message: 'qr_code is required' });
    }

    const registration = await findRegistrationByQRCode(qr_code);
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found for provided QR code' });
    }

    if (registration.status === 'checked-in') {
      return res.status(400).json({ message: 'Student already checked in for this event' });
    }

    await updateRegistrationStatus(registration.id, 'checked-in');

    res.json({
      message: 'Check-in successful',
      registration: {
        id: registration.id,
        user_id: registration.user_id,
        event_id: registration.event_id,
        status: 'checked-in',
        qr_code: registration.qr_code
      }
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: 'Server error during check-in' });
  }
};

module.exports = {
  registerForEventController,
  getMyEventsController,
  checkInController
};

