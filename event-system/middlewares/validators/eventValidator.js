const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    success: false,
    message: 'Validation error',
    errors: errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
    })),
  });
};

const isValidDate = (value) => !Number.isNaN(new Date(value).getTime());

const createEventValidation = [
  body('title').trim().notEmpty().withMessage('title is required'),
  body('description').optional({ values: 'falsy' }).isString(),
  body('location').trim().notEmpty().withMessage('location is required'),
  body('start_time')
    .notEmpty()
    .withMessage('start_time is required')
    .bail()
    .custom(isValidDate)
    .withMessage('start_time must be a valid date'),
  body('end_time')
    .notEmpty()
    .withMessage('end_time is required')
    .bail()
    .custom(isValidDate)
    .withMessage('end_time must be a valid date')
    .bail()
    .custom((value, { req }) => new Date(value) > new Date(req.body.start_time))
    .withMessage('end_time must be later than start_time'),
  body('max_participants')
    .isInt({ gt: 0 })
    .withMessage('max_participants must be a number greater than 0'),
  handleValidationErrors,
];

const registerForEventValidation = [
  body().custom(() => true),
  handleValidationErrors,
];

const attendanceCheckinValidation = [
  body('qr_token')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('qr_token must be a string'),
  body('qr_code')
    .optional({ values: 'falsy' })
    .isString()
    .withMessage('qr_code must be a string'),
  body().custom((_, { req }) => {
    if (!req.body.qr_token && !req.body.qr_code) {
      throw new Error('qr_token or qr_code is required');
    }
    return true;
  }),
  handleValidationErrors,
];

module.exports = {
  createEventValidation,
  registerForEventValidation,
  attendanceCheckinValidation,
};
