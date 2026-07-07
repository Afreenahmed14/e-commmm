const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Review = require('../models/Review');
const Candidate = require('../models/Candidate');
const ContactUnlock = require('../models/ContactUnlock');
const Notification = require('../models/Notification');
const { UNLOCK_STATUS } = require('../constants/status');

/**
 * Recalculates and persists a candidate's aggregate rating/reviewsCount.
 * Called after any review create/update/delete.
 */
const recalculateCandidateRating = async (candidateId) => {
  const stats = await Review.aggregate([
    { $match: { candidateId } },
    { $group: { _id: '$candidateId', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const avgRating = stats.length ? Math.round(stats[0].avgRating * 10) / 10 : 0;
  const count = stats.length ? stats[0].count : 0;

  await Candidate.findByIdAndUpdate(candidateId, { rating: avgRating, reviewsCount: count });
};

/**
 * POST /api/v1/reviews
 * A company may only review a candidate whose contact they've unlocked —
 * this keeps reviews tied to a genuine (paid) engagement. req.user IS the
 * Company document.
 */
const createReview = asyncHandler(async (req, res) => {
  const { candidateId, rating, review } = req.body;

  const unlock = await ContactUnlock.findOne({
    companyId: req.user._id,
    candidateId,
    status: UNLOCK_STATUS.ACTIVE,
  });
  if (!unlock) {
    throw ApiError.forbidden('You can only review candidates whose contact you have unlocked');
  }

  const existing = await Review.findOne({ candidateId, companyId: req.user._id });
  if (existing) throw ApiError.conflict('You have already reviewed this candidate');

  const newReview = await Review.create({
    candidateId, companyId: req.user._id, rating, review,
  });

  await recalculateCandidateRating(candidateId);

  await Notification.create({
    userId: candidateId,
    userModel: 'Candidate',
    title: 'New review received',
    message: `${req.user.companyName} left you a ${rating}-star review.`,
    type: 'review',
  });

  return new ApiResponse(201, { review: newReview }, 'Review submitted').send(res);
});

/**
 * PUT /api/v1/reviews/:id
 */
const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findOne({ _id: req.params.id, companyId: req.user._id });
  if (!review) throw ApiError.notFound('Review not found');

  if (req.body.rating !== undefined) review.rating = req.body.rating;
  if (req.body.review !== undefined) review.review = req.body.review;
  await review.save();

  await recalculateCandidateRating(review.candidateId);

  return new ApiResponse(200, { review }, 'Review updated').send(res);
});

/**
 * DELETE /api/v1/reviews/:id
 */
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findOneAndDelete({ _id: req.params.id, companyId: req.user._id });
  if (!review) throw ApiError.notFound('Review not found');

  await recalculateCandidateRating(review.candidateId);

  return new ApiResponse(200, null, 'Review deleted').send(res);
});

/**
 * GET /api/v1/reviews/candidate/:candidateId
 */
const getCandidateReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ candidateId: req.params.candidateId })
    .populate('companyId', 'companyName logo')
    .sort('-createdAt');

  return new ApiResponse(200, { reviews }, 'Reviews fetched').send(res);
});

module.exports = { createReview, updateReview, deleteReview, getCandidateReviews };
