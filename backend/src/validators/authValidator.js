const { body } = require('express-validator');

const registerCandidateValidator = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  body('hourlyRate').optional().isFloat({ min: 0 }).withMessage('Hourly rate must be a positive number'),
];

const registerCompanyValidator = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Contact name must be 2-100 characters'),
  body('companyName').trim().isLength({ min: 2, max: 150 }).withMessage('Company name must be 2-150 characters'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
];

const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotPasswordValidator = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
];

const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
];

module.exports = {
  registerCandidateValidator,
  registerCompanyValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
};
