const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    success: false,
    message: errors.array()[0].msg || 'Lỗi dữ liệu đầu vào',
    errors: errors.array().map((err) => ({
      field: err.param,
      message: err.msg
    }))
  });
};

const registerValidation = [
  body('full_name').trim().notEmpty().withMessage('full_name is required'),
  body('email').isEmail({ require_tld: false }).withMessage('email must be a valid email address'),
  body('password').isLength({ min: 6 }).withMessage('password must be at least 6 characters long'),
  body('student_code').optional().isLength({ max: 50 }).withMessage('student_code must be at most 50 characters'),
  handleValidationErrors
];

const loginValidation = [
  body('email').trim().isEmail({ require_tld: false }).withMessage('Email không hợp lệ'),
  body('password').notEmpty().withMessage('Vui lòng nhập mật khẩu'),
  handleValidationErrors
];

module.exports = {
  registerValidation,
  loginValidation
};

