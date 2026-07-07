const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  createPaymentOrder, verifyPayment, getPaymentHistory, updateEngagement, getInvoice,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { COMPANY, CANDIDATE } = require('../constants/roles');

router.use(protect);

router.post(
  '/order',
  authorize(COMPANY),
  body('candidateId').isMongoId().withMessage('Valid candidateId is required'),
  validateRequest,
  createPaymentOrder
);

router.post(
  '/verify',
  authorize(COMPANY),
  body('razorpay_order_id').notEmpty(),
  body('razorpay_payment_id').notEmpty(),
  body('razorpay_signature').notEmpty(),
  validateRequest,
  verifyPayment
);

router.get('/history', authorize(COMPANY), getPaymentHistory);
router.get('/:id/invoice', authorize(COMPANY), getInvoice);

// Either side of the engagement (the company that unlocked, or the
// freelancer who was unlocked) may set the start/end dates — ownership is
// checked inside the controller since it depends on the unlock record, not
// just the role.
router.patch(
  '/unlocks/:unlockId/engagement',
  authorize(COMPANY, CANDIDATE),
  body('engagementStart').optional({ nullable: true }).isISO8601().withMessage('Invalid start date'),
  body('engagementEnd').optional({ nullable: true }).isISO8601().withMessage('Invalid end date'),
  validateRequest,
  updateEngagement
);

module.exports = router;
