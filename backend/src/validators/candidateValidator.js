const { body, query } = require('express-validator');

const updateCandidateValidator = [
  body('headline').optional().trim().isLength({ max: 150 }),
  body('about').optional().trim().isLength({ max: 2000 }),
  body('experience').optional().isFloat({ min: 0 }).withMessage('Experience must be a positive number'),
  body('hourlyRate').optional().isFloat({ min: 0 }).withMessage('Hourly rate must be a positive number'),
  body('skills').optional().isArray().withMessage('Skills must be an array'),
  body('availability')
    .optional()
    .isIn(['full-time', 'part-time', 'contract', 'not-available']),
  body('github').optional().trim().isURL().withMessage('Github must be a valid URL'),
  body('linkedin').optional().trim().isURL().withMessage('LinkedIn must be a valid URL'),
];

const searchCandidateValidator = [
  query('minRate').optional().isFloat({ min: 0 }),
  query('maxRate').optional().isFloat({ min: 0 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];

module.exports = { updateCandidateValidator, searchCandidateValidator };
