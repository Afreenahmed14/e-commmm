const mongoose = require('mongoose');
const { PAYMENT_STATUS } = require('../constants/status');

/**
 * Records every Razorpay transaction. A payment becomes `contactUnlocked: true`
 * only after signature verification succeeds in paymentController.verifyPayment,
 * at which point a corresponding ContactUnlock document is also created.
 */
const paymentSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    paymentGateway: { type: String, default: 'razorpay' },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String, default: '' },
    razorpaySignature: { type: String, default: '' },
    transactionId: { type: String, default: '' },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.CREATED,
    },
    paymentDate: { type: Date, default: null },
    contactUnlocked: { type: Boolean, default: false },
    invoiceNumber: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

paymentSchema.index({ companyId: 1, candidateId: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
