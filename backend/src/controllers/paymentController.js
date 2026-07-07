const { v4: uuidv4 } = require('uuid');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Payment = require('../models/Payment');
const Candidate = require('../models/Candidate');
const ContactUnlock = require('../models/ContactUnlock');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const { createOrder, verifySignature } = require('../services/razorpayService');
const { PAYMENT_STATUS, UNLOCK_STATUS } = require('../constants/status');
const MESSAGES = require('../constants/messages');

/**
 * POST /api/v1/payments/order
 * req.user IS the Company document. The unlock price equals the
 * candidate's own hourlyRate (read server-side, never trusted from the
 * client) to prevent price tampering — unlocking a contact costs the same
 * as one hour of that freelancer's time.
 */
const createPaymentOrder = asyncHandler(async (req, res) => {
  const { candidateId } = req.body;

  const candidate = await Candidate.findById(candidateId);
  if (!candidate) throw ApiError.notFound('Candidate not found');

  if (candidate.hourlyRate === null || candidate.hourlyRate === undefined) {
    throw ApiError.badRequest('This freelancer has not set an hourly rate yet, so their contact cannot be unlocked.');
  }

  const existingUnlock = await ContactUnlock.findOne({
    companyId: req.user._id,
    candidateId,
    status: UNLOCK_STATUS.ACTIVE,
  });
  if (existingUnlock) {
    throw ApiError.conflict(MESSAGES.PAYMENT.ALREADY_UNLOCKED);
  }

  const amount = Math.round(candidate.hourlyRate * 100); // rupees → paise
  const currency = process.env.CURRENCY || 'INR';
  const receipt = `unlock_${uuidv4().slice(0, 16)}`;

  const order = await createOrder({ amount, currency, receipt });

  const payment = await Payment.create({
    companyId: req.user._id,
    candidateId,
    amount,
    currency,
    razorpayOrderId: order.id,
    status: PAYMENT_STATUS.CREATED,
  });

  return new ApiResponse(201, {
    orderId: order.id,
    amount,
    currency,
    keyId: process.env.RAZORPAY_KEY_ID,
    paymentRecordId: payment._id,
  }, MESSAGES.PAYMENT.ORDER_CREATED).send(res);
});

/**
 * POST /api/v1/payments/verify
 * Verifies the Razorpay checkout signature server-side, and only on success
 * marks the payment paid, records the ContactUnlock, and notifies the
 * candidate. This is the single choke point that grants contact access.
 */
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
  if (!payment) throw ApiError.notFound('Payment order not found');

  const isValid = verifySignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature,
  });

  if (!isValid) {
    payment.status = PAYMENT_STATUS.FAILED;
    await payment.save();
    throw ApiError.badRequest(MESSAGES.PAYMENT.VERIFICATION_FAILED);
  }

  payment.status = PAYMENT_STATUS.PAID;
  payment.razorpayPaymentId = razorpay_payment_id;
  payment.razorpaySignature = razorpay_signature;
  payment.paymentDate = new Date();
  payment.contactUnlocked = true;
  payment.transactionId = razorpay_payment_id;
  payment.invoiceNumber = `INV-${Date.now()}-${payment._id.toString().slice(-6)}`;
  await payment.save();

  const unlock = await ContactUnlock.findOneAndUpdate(
    { companyId: payment.companyId, candidateId: payment.candidateId },
    { paymentId: payment._id, unlockDate: new Date(), status: UNLOCK_STATUS.ACTIVE },
    { upsert: true, new: true }
  );

  await Notification.create({
    userId: payment.candidateId,
    userModel: 'Candidate',
    title: 'Your contact details were unlocked',
    message: 'A company has unlocked your contact details and may reach out soon.',
    type: 'payment',
  });

  return new ApiResponse(200, { payment, unlock }, MESSAGES.PAYMENT.VERIFIED).send(res);
});

/**
 * GET /api/v1/payments/history
 * Enriched with each payment's matching ContactUnlock (so the dashboard can
 * show/edit engagement start & end dates right next to the amount) and
 * whether this company has already left a review for that candidate.
 */
const getPaymentHistory = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ companyId: req.user._id, status: PAYMENT_STATUS.PAID })
    .populate('candidateId', 'headline hourlyRate profileImage')
    .sort('-paymentDate')
    .lean();

  const candidateIds = payments.map((p) => p.candidateId?._id).filter(Boolean);

  const [unlocks, reviews] = await Promise.all([
    ContactUnlock.find({ companyId: req.user._id, candidateId: { $in: candidateIds } }).lean(),
    Review.find({ companyId: req.user._id, candidateId: { $in: candidateIds } }).lean(),
  ]);

  const unlockByCandidate = new Map(unlocks.map((u) => [u.candidateId.toString(), u]));
  const reviewByCandidate = new Map(reviews.map((r) => [r.candidateId.toString(), r]));

  const enriched = payments.map((p) => {
    const candidateIdStr = p.candidateId?._id?.toString();
    const unlock = candidateIdStr ? unlockByCandidate.get(candidateIdStr) : null;
    const review = candidateIdStr ? reviewByCandidate.get(candidateIdStr) : null;
    return {
      ...p,
      unlock: unlock
        ? { _id: unlock._id, engagementStart: unlock.engagementStart, engagementEnd: unlock.engagementEnd }
        : null,
      myReview: review || null,
    };
  });

  return new ApiResponse(200, { payments: enriched }, 'Payment history fetched').send(res);
});

/**
 * PATCH /api/v1/payments/unlocks/:unlockId/engagement
 * Sets when the engagement actually started/ended so both sides can work
 * out hours worked x hourly rate without leaving the platform. Either party
 * to the unlock (the company that paid, or the freelancer whose contact was
 * unlocked) may set these — whichever one has the real dates handy.
 */
const updateEngagement = asyncHandler(async (req, res) => {
  const { unlockId } = req.params;
  const { engagementStart, engagementEnd } = req.body;

  const unlock = await ContactUnlock.findById(unlockId);
  if (!unlock) throw ApiError.notFound('Unlock record not found');

  const isOwningCompany = req.user.role === 'company' && unlock.companyId.toString() === req.user._id.toString();
  const isOwningCandidate = req.user.role === 'candidate' && unlock.candidateId.toString() === req.user._id.toString();
  if (!isOwningCompany && !isOwningCandidate) {
    throw ApiError.forbidden('You are not part of this engagement');
  }

  if (engagementStart !== undefined) unlock.engagementStart = engagementStart || null;
  if (engagementEnd !== undefined) unlock.engagementEnd = engagementEnd || null;

  if (unlock.engagementStart && unlock.engagementEnd && unlock.engagementEnd < unlock.engagementStart) {
    throw ApiError.badRequest('End date cannot be before the start date');
  }

  await unlock.save();

  return new ApiResponse(200, { unlock }, 'Engagement dates updated').send(res);
});

/**
 * GET /api/v1/payments/:id/invoice
 */
const getInvoice = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({
    _id: req.params.id,
    companyId: req.user._id,
    status: PAYMENT_STATUS.PAID,
  }).populate('candidateId', 'headline');

  if (!payment) throw ApiError.notFound('Invoice not found');

  return new ApiResponse(200, { invoice: payment }, 'Invoice fetched').send(res);
});

module.exports = {
  createPaymentOrder,
  verifyPayment,
  getPaymentHistory,
  updateEngagement,
  getInvoice,
};
