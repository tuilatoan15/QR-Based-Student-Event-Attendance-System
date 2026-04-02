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

const registerValidation = [
  body('full_name').trim().notEmpty().withMessage('full_name is required'),
  body('email').isEmail().withMessage('email must be valid'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('password must be at least 6 characters long'),
  body('student_code')
    .optional({ values: 'falsy' })
    .isLength({ max: 50 })
    .withMessage('student_code must be at most 50 characters'),
  handleValidationErrors,
];

const registerOrganizerValidation = [
  body('full_name').trim().notEmpty().withMessage('full_name is required'),
  body('email').isEmail().withMessage('email must be valid'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('password must be at least 6 characters long'),
  body('organization_name')
    .trim()
    .notEmpty()
    .withMessage('organization_name is required'),
  body('position').optional({ values: 'falsy' }).isString(),
  body('phone').optional({ values: 'falsy' }).isString(),
  body('bio').optional({ values: 'falsy' }).isString(),
  body('website').optional({ values: 'falsy' }).isURL().withMessage('website must be a valid URL'),
  handleValidationErrors,
];

const loginValidation = [
  body('email').isEmail().withMessage('email must be valid'),
  body('password').notEmpty().withMessage('password is required'),
  handleValidationErrors,
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('email must be valid'),
  handleValidationErrors,
];

module.exports = {
  registerValidation,
  registerOrganizerValidation,
  loginValidation,
  forgotPasswordValidation,
};
