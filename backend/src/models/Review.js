const mongoose = require('mongoose');

/**
 * A company may leave one review per candidate, typically after unlocking
 * contact details and completing external work. Enforced via a compound
 * unique index rather than application logic alone.
 */
const reviewSchema = new mongoose.Schema(
  {
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

reviewSchema.index({ candidateId: 1, companyId: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
