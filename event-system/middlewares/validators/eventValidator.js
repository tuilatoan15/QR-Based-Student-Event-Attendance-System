const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    success: false,
    message: 'Validation error',
    errors: errors.array().map((err) => ({
      field: err.param,
      message: err.msg
    }))
  });
};

const isValidDate = (value) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const createEventValidation = [
  body('title').trim().notEmpty().withMessage('title is required'),
  body('location').trim().notEmpty().withMessage('location is required'),
  body('start_time')
    .notEmpty()
    .withMessage('start_time is required')
    .bail()
    .custom(isValidDate)
    .withMessage('start_time must be a valid date-time'),
  body('end_time')
    .notEmpty()
    .withMessage('end_time is required')
    .bail()
    .custom(isValidDate)
    .withMessage('end_time must be a valid date-time')
    .bail()
    .custom((value, { req }) => {
      if (!req.body.start_time || !isValidDate(req.body.start_time)) {
        return true;
      }
      const start = new Date(req.body.start_time);
      const end = new Date(value);
      return end > start;
    })
    .withMessage('end_time must be greater than start_time'),
  body('max_participants')
    .notEmpty()
    .withMessage('max_participants is required')
    .bail()
    .isInt({ gt: 0 })
    .withMessage('max_participants must be a number greater than 0'),
  body('category_id')
    .optional()
    .isInt({ gt: 0 })
    .withMessage('category_id must be a positive integer'),
  handleValidationErrors
];

const updateEventValidation = [
  body('title').optional().trim().notEmpty().withMessage('title cannot be empty'),
  body('location').optional().trim().notEmpty().withMessage('location cannot be empty'),
  body('start_time')
    .optional()
    .custom(isValidDate)
    .withMessage('start_time must be a valid date-time'),
  body('end_time')
    .optional()
    .custom(isValidDate)
    .withMessage('end_time must be a valid date-time')
    .bail()
    .custom((value, { req }) => {
      const startValue = req.body.start_time;
      const endValue = value;
      if (!startValue || !isValidDate(startValue) || !isValidDate(endValue)) {
        return true;
      }
      const start = new Date(startValue);
      const end = new Date(endValue);
      return end > start;
    })
    .withMessage('end_time must be greater than start_time'),
  body('max_participants')
    .optional()
    .isInt({ gt: 0 })
    .withMessage('max_participants must be a number greater than 0'),
  body('category_id')
    .optional()
    .isInt({ gt: 0 })
    .withMessage('category_id must be a positive integer'),
  handleValidationErrors
];

module.exports = {
  createEventValidation,
  updateEventValidation
};

