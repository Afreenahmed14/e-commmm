const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Candidate = require('../models/Candidate');
const ContactUnlock = require('../models/ContactUnlock');
const { replaceFile } = require('../helpers/uploadHelper');
const { VISIBILITY } = require('../constants/status');

/** Fields that must never leave the server on a public-facing candidate document. */
const PUBLIC_EXCLUDE = '-__v -password -resetPasswordToken -resetPasswordExpires -tokenVersion -name -email';

/**
 * GET /api/v1/candidates/me/profile
 * req.user IS the Candidate document (see authMiddleware) — no separate
 * lookup by a foreign userId needed.
 */
const getMyProfile = asyncHandler(async (req, res) => {
  return new ApiResponse(200, { candidate: req.user.toSafeObject() }, 'Profile fetched').send(res);
});

/**
 * PUT /api/v1/candidates/me/profile
 */
const updateMyProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    'headline', 'about', 'experience', 'skills', 'hourlyRate', 'availability',
    'languages', 'portfolioLinks', 'github', 'linkedin', 'education',
    'projects', 'visibility', 'location',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) req.user[field] = req.body[field];
  });

  await req.user.save();

  return new ApiResponse(200, { candidate: req.user.toSafeObject() }, 'Profile updated').send(res);
});

/**
 * DELETE /api/v1/candidates/me/profile
 * Soft-deletes by marking the account deleted + hiding from search, rather
 * than destroying historical payment/review records tied to this candidate.
 */
const deleteMyProfile = asyncHandler(async (req, res) => {
  req.user.status = 'deleted';
  req.user.visibility = VISIBILITY.PRIVATE;
  await req.user.save();
  return new ApiResponse(200, null, 'Profile deleted').send(res);
});

/**
 * POST /api/v1/candidates/me/resume
 */
const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('Resume file is required');

  const url = await replaceFile(req.file, 'resumes', req.user.resume);
  req.user.resume = url;
  await req.user.save();

  return new ApiResponse(200, { resume: url }, 'Resume uploaded').send(res);
});

/**
 * POST /api/v1/candidates/me/image
 */
const uploadProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('Image file is required');

  const url = await replaceFile(req.file, 'profile-images', req.user.profileImage);
  req.user.profileImage = url;
  await req.user.save();

  return new ApiResponse(200, { profileImage: url }, 'Profile image uploaded').send(res);
});

/**
 * GET /api/v1/candidates/search
 * Public search & filter endpoint used by the "Browse Freelancers" page.
 * Never exposes contact details (email) — those come only via the
 * payment/unlock flow.
 */
const searchCandidates = asyncHandler(async (req, res) => {
  const {
    q, skill, minRate, maxRate, availability, city, country,
    language, minRating, verified, remote,
    page = 1, limit = 12, sort = '-rating',
  } = req.query;

  const filter = { visibility: VISIBILITY.PUBLIC, hourlyRate: { $ne: null } };

  if (q) filter.$text = { $search: q };
  if (skill) filter.skills = { $in: [].concat(skill) };
  if (language) filter.languages = { $in: [].concat(language) };
  if (availability) filter.availability = availability;
  if (city) filter['location.city'] = new RegExp(city, 'i');
  if (country) filter['location.country'] = new RegExp(country, 'i');
  if (remote !== undefined) filter['location.remote'] = remote === 'true';
  if (verified === 'true') filter.verificationStatus = 'verified';
  if (minRating) filter.rating = { $gte: Number(minRating) };

  if (minRate || maxRate) {
    if (minRate) filter.hourlyRate.$gte = Number(minRate);
    if (maxRate) filter.hourlyRate.$lte = Number(maxRate);
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [candidates, total] = await Promise.all([
    Candidate.find(filter, PUBLIC_EXCLUDE)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Candidate.countDocuments(filter),
  ]);

  return new ApiResponse(200, {
    candidates,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  }, 'Candidates fetched').send(res);
});

/**
 * GET /api/v1/candidates/:id
 * Public profile view. If the requester is an authenticated company that
 * has an active ContactUnlock for this candidate, contact info (name +
 * email) is included; otherwise it is omitted entirely.
 */
const getCandidateById = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findById(req.params.id, PUBLIC_EXCLUDE).lean();
  if (!candidate || candidate.visibility !== VISIBILITY.PUBLIC) {
    throw ApiError.notFound('Candidate not found');
  }

  let contactInfo = null;

  if (req.user && req.user.role === 'company') {
    const unlock = await ContactUnlock.findOne({
      companyId: req.user._id,
      candidateId: candidate._id,
      status: 'active',
    });
    if (unlock) {
      const contactOwner = await Candidate.findById(candidate._id).select('name email');
      contactInfo = {
        name: contactOwner.name,
        email: contactOwner.email,
        unlockId: unlock._id,
        engagementStart: unlock.engagementStart,
        engagementEnd: unlock.engagementEnd,
      };
    }
  }

  return new ApiResponse(200, { candidate, contactInfo }, 'Candidate fetched').send(res);
});

/**
 * GET /api/v1/candidates/me/unlocks
 * Every company that currently has this freelancer's contact unlocked,
 * along with the engagement start/end dates either side has set — lets the
 * freelancer work out hours x hourly rate for each engagement themselves.
 */
const getMyUnlocks = asyncHandler(async (req, res) => {
  const unlocks = await ContactUnlock.find({ candidateId: req.user._id, status: 'active' })
    .populate('companyId', 'companyName logo')
    .populate('paymentId', 'amount paymentDate invoiceNumber')
    .sort('-unlockDate');

  return new ApiResponse(200, { unlocks }, 'Unlocks fetched').send(res);
});

module.exports = {
  getMyProfile,
  updateMyProfile,
  deleteMyProfile,
  uploadResume,
  uploadProfileImage,
  searchCandidates,
  getCandidateById,
  getMyUnlocks,
};
