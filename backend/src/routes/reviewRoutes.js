const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  createReview, updateReview, deleteReview, getCandidateReviews,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { COMPANY } = require('../constants/roles');

router.get('/candidate/:candidateId', getCandidateReviews); // public

router.post(
  '/',
  protect,
  authorize(COMPANY),
  body('candidateId').isMongoId(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('review').optional().trim().isLength({ max: 1000 }),
  validateRequest,
  createReview
);

router.put('/:id', protect, authorize(COMPANY), updateReview);
router.delete('/:id', protect, authorize(COMPANY), deleteReview);

module.exports = router;
