const mongoose = require('mongoose');
const { UNLOCK_STATUS } = require('../constants/status');

/**
 * Auditable record of every contact-unlock event — the single source of
 * truth for whether a given Company currently has access to a given
 * Candidate's contact details. Queried on every "view contact" request
 * rather than trusting a cached flag elsewhere.
 */
const contactUnlockSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
    unlockDate: { type: Date, default: Date.now },
    // Set by either side (company or the freelancer themselves) once work
    // is scheduled/completed, so both can see the same numbers and work out
    // the total (hourlyRate x hours) without going back and forth off-platform.
    engagementStart: { type: Date, default: null },
    engagementEnd: { type: Date, default: null },
    status: {
      type: String,
      enum: Object.values(UNLOCK_STATUS),
      default: UNLOCK_STATUS.ACTIVE,
    },
  },
  { timestamps: true }
);

contactUnlockSchema.index({ companyId: 1, candidateId: 1 }, { unique: true });

module.exports = mongoose.model('ContactUnlock', contactUnlockSchema);
