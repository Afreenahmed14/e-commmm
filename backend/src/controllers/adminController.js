const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Candidate = require('../models/Candidate');
const Company = require('../models/Company');
const Admin = require('../models/Admin');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Category = require('../models/Category');
const Skill = require('../models/Skill');
const Verification = require('../models/Verification');
const Notification = require('../models/Notification');
const ContactUnlock = require('../models/ContactUnlock');
const { PAYMENT_STATUS, VERIFICATION_STATUS, USER_STATUS, UNLOCK_STATUS } = require('../constants/status');

const MODEL_BY_ROLE = { candidate: Candidate, company: Company, admin: Admin };
const MODEL_NAME_BY_ROLE = { candidate: 'Candidate', company: 'Company', admin: 'Admin' };

/**
 * GET /api/v1/admin/dashboard
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    totalCandidates, totalCompanies, totalPayments,
    revenueAgg, pendingVerifications, recentPayments,
    todayCandidateSignups, todayCompanySignups,
    todayCandidateLogins, todayCompanyLogins,
    totalActiveUnlocks,
  ] = await Promise.all([
    Candidate.countDocuments(),
    Company.countDocuments(),
    Payment.countDocuments({ status: PAYMENT_STATUS.PAID }),
    Payment.aggregate([
      { $match: { status: PAYMENT_STATUS.PAID } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Verification.countDocuments({ status: VERIFICATION_STATUS.PENDING }),
    Payment.find({ status: PAYMENT_STATUS.PAID })
      .sort('-paymentDate')
      .limit(10)
      .populate('companyId', 'companyName')
      .populate('candidateId', 'headline'),
    Candidate.countDocuments({ createdAt: { $gte: startOfToday } }),
    Company.countDocuments({ createdAt: { $gte: startOfToday } }),
    Candidate.countDocuments({ lastLogin: { $gte: startOfToday } }),
    Company.countDocuments({ lastLogin: { $gte: startOfToday } }),
    ContactUnlock.countDocuments({ status: UNLOCK_STATUS.ACTIVE }),
  ]);

  const totalRevenue = revenueAgg.length ? revenueAgg[0].total : 0;

  return new ApiResponse(200, {
    totalCandidates,
    totalCompanies,
    totalUnlocks: totalPayments,
    totalRevenue,
    pendingVerifications,
    recentPayments,
    // "Today" widget for the admin overview — new registrations and logins
    // since midnight, split by role so the admin can see freelancer vs.
    // client (HR) activity at a glance.
    today: {
      signups: {
        candidates: todayCandidateSignups,
        companies: todayCompanySignups,
        total: todayCandidateSignups + todayCompanySignups,
      },
      logins: {
        candidates: todayCandidateLogins,
        companies: todayCompanyLogins,
        total: todayCandidateLogins + todayCompanyLogins,
      },
    },
    totalActiveUnlocks,
  }, 'Dashboard stats fetched').send(res);
});

/**
 * GET /api/v1/admin/revenue?range=daily|weekly|monthly
 */
const getRevenueReport = asyncHandler(async (req, res) => {
  const { range = 'monthly' } = req.query;

  const dateFormat = {
    daily: '%Y-%m-%d',
    weekly: '%Y-%U',
    monthly: '%Y-%m',
  }[range] || '%Y-%m';

  const report = await Payment.aggregate([
    { $match: { status: PAYMENT_STATUS.PAID } },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: '$paymentDate' } },
        revenue: { $sum: '$amount' },
        transactions: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return new ApiResponse(200, { range, report }, 'Revenue report fetched').send(res);
});

/**
 * GET /api/v1/admin/users?role=&status=&page=&limit=
 * Since candidates, companies, and admins live in separate collections
 * (see models/Candidate.js for why), this endpoint queries whichever are
 * requested and merges them into one normalized list for the admin UI.
 * Without a `role` filter, it queries all three and merges by createdAt.
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, status, page = 1, limit = 20 } = req.query;
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

  const rolesToQuery = role ? [role] : ['candidate', 'company', 'admin'];
  const filter = {};
  if (status) filter.status = status;

  const results = await Promise.all(
    rolesToQuery.map((r) => MODEL_BY_ROLE[r].find(filter).select('name email role status isVerified lastLogin createdAt').lean())
  );

  const merged = results.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const total = merged.length;
  const users = merged.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  return new ApiResponse(200, {
    users,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  }, 'Users fetched').send(res);
});

/**
 * PATCH /api/v1/admin/users/:id/status
 * Suspend / reactivate any account. Since we don't know which collection
 * `:id` belongs to up front, `role` must be supplied by the client (the
 * admin users table already knows each row's role after getAllUsers).
 */
const updateUserStatus = asyncHandler(async (req, res) => {
  const { status, role } = req.body;
  if (!Object.values(USER_STATUS).includes(status)) {
    throw ApiError.badRequest('Invalid status value');
  }
  const Model = MODEL_BY_ROLE[role];
  if (!Model) throw ApiError.badRequest('Invalid role');

  const user = await Model.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!user) throw ApiError.notFound('User not found');

  await Notification.create({
    userId: user._id,
    userModel: MODEL_NAME_BY_ROLE[role],
    title: 'Account status updated',
    message: `Your account status has been changed to "${status}" by an administrator.`,
    type: 'warning',
  });

  return new ApiResponse(200, { user }, 'User status updated').send(res);
});

/**
 * GET /api/v1/admin/candidates
 */
const getAllCandidates = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, verificationStatus } = req.query;
  const filter = {};
  if (verificationStatus) filter.verificationStatus = verificationStatus;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

  const [candidates, total] = await Promise.all([
    Candidate.find(filter).sort('-createdAt').skip((pageNum - 1) * limitNum).limit(limitNum),
    Candidate.countDocuments(filter),
  ]);

  return new ApiResponse(200, {
    candidates,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  }, 'Candidates fetched').send(res);
});

/**
 * PATCH /api/v1/admin/candidates/:id
 * Admin-side edit of a freelancer's profile fields. Deliberately a
 * whitelist (never name/email/password/role/etc.) so this can't be used
 * to take over or silently relogin as the account.
 */
const CANDIDATE_ADMIN_EDITABLE = [
  'headline', 'about', 'experience', 'skills', 'hourlyRate', 'availability',
  'languages', 'portfolioLinks', 'github', 'linkedin', 'visibility',
  'verificationStatus', 'location',
];

const updateCandidateAsAdmin = asyncHandler(async (req, res) => {
  const updates = {};
  for (const key of CANDIDATE_ADMIN_EDITABLE) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (Object.keys(updates).length === 0) {
    throw ApiError.badRequest('No editable fields provided');
  }

  const candidate = await Candidate.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!candidate) throw ApiError.notFound('Candidate not found');

  await Notification.create({
    userId: candidate._id,
    userModel: 'Candidate',
    title: 'Profile updated by admin',
    message: 'An administrator made changes to your profile.',
    type: 'info',
  });

  return new ApiResponse(200, { candidate }, 'Candidate updated').send(res);
});

/**
 * DELETE /api/v1/admin/candidates/:id
 * Permanently removes the account. Unlike suspending (status), this cannot
 * be undone, so it's a separate, deliberate action from updateUserStatus.
 */
const deleteCandidateAsAdmin = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findByIdAndDelete(req.params.id);
  if (!candidate) throw ApiError.notFound('Candidate not found');
  return new ApiResponse(200, null, 'Candidate deleted').send(res);
});

/**
 * GET /api/v1/admin/companies
 */
const getAllCompanies = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, verificationStatus } = req.query;
  const filter = {};
  if (verificationStatus) filter.verificationStatus = verificationStatus;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

  const [companies, total] = await Promise.all([
    Company.find(filter).sort('-createdAt').skip((pageNum - 1) * limitNum).limit(limitNum),
    Company.countDocuments(filter),
  ]);

  return new ApiResponse(200, {
    companies,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  }, 'Companies fetched').send(res);
});

/**
 * PATCH /api/v1/admin/companies/:id
 * Same whitelist pattern as candidates — admin can correct/moderate
 * profile content but never touch login credentials directly.
 */
const COMPANY_ADMIN_EDITABLE = [
  'companyName', 'website', 'industry', 'description', 'contactPerson',
  'location', 'gstNumber', 'verificationStatus',
];

const updateCompanyAsAdmin = asyncHandler(async (req, res) => {
  const updates = {};
  for (const key of COMPANY_ADMIN_EDITABLE) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  if (Object.keys(updates).length === 0) {
    throw ApiError.badRequest('No editable fields provided');
  }

  const company = await Company.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!company) throw ApiError.notFound('Company not found');

  await Notification.create({
    userId: company._id,
    userModel: 'Company',
    title: 'Profile updated by admin',
    message: 'An administrator made changes to your company profile.',
    type: 'info',
  });

  return new ApiResponse(200, { company }, 'Company updated').send(res);
});

/**
 * DELETE /api/v1/admin/companies/:id
 * Permanent delete — see deleteCandidateAsAdmin for the same rationale.
 */
const deleteCompanyAsAdmin = asyncHandler(async (req, res) => {
  const company = await Company.findByIdAndDelete(req.params.id);
  if (!company) throw ApiError.notFound('Company not found');
  return new ApiResponse(200, null, 'Company deleted').send(res);
});

/**
 * GET /api/v1/admin/payments
 */
const getAllPayments = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate('companyId', 'companyName')
      .populate('candidateId', 'headline')
      .sort('-createdAt').skip((pageNum - 1) * limitNum).limit(limitNum),
    Payment.countDocuments(filter),
  ]);

  return new ApiResponse(200, {
    payments,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  }, 'Payments fetched').send(res);
});

/**
 * GET /api/v1/admin/verifications?status=pending
 * `profileId` is populated dynamically (refPath: 'role') to pull in either
 * the Candidate or Company document directly.
 */
const getVerificationRequests = asyncHandler(async (req, res) => {
  const { status = VERIFICATION_STATUS.PENDING } = req.query;
  const requests = await Verification.find({ status })
    .populate('profileId', 'name email companyName headline')
    .sort('-createdAt');

  return new ApiResponse(200, { requests }, 'Verification requests fetched').send(res);
});

/**
 * PATCH /api/v1/admin/verifications/:id
 * Approve or reject a pending verification request.
 */
const reviewVerificationRequest = asyncHandler(async (req, res) => {
  const { status, reviewNote } = req.body;
  if (![VERIFICATION_STATUS.VERIFIED, VERIFICATION_STATUS.REJECTED].includes(status)) {
    throw ApiError.badRequest('Status must be either verified or rejected');
  }

  const request = await Verification.findByIdAndUpdate(
    req.params.id,
    { status, reviewNote, reviewedBy: req.user._id, reviewedAt: new Date() },
    { new: true }
  );
  if (!request) throw ApiError.notFound('Verification request not found');

  const Model = request.role === 'Candidate' ? Candidate : Company;
  await Model.findByIdAndUpdate(request.profileId, { verificationStatus: status });

  await Notification.create({
    userId: request.profileId,
    userModel: request.role,
    title: 'Verification update',
    message: status === VERIFICATION_STATUS.VERIFIED
      ? 'Your profile has been verified.'
      : `Your verification request was rejected. ${reviewNote || ''}`.trim(),
    type: 'verification',
  });

  return new ApiResponse(200, { request }, 'Verification request reviewed').send(res);
});

/** Categories */
const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const slug = name.toLowerCase().trim().replace(/\s+/g, '-');
  const category = await Category.create({ name, slug, description });
  return new ApiResponse(201, { category }, 'Category created').send(res);
});

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort('name');
  return new ApiResponse(200, { categories }, 'Categories fetched').send(res);
});

/** PATCH /api/v1/admin/categories/:id */
const updateCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const updates = {};
  if (name !== undefined) {
    updates.name = name;
    updates.slug = name.toLowerCase().trim().replace(/\s+/g, '-');
  }
  if (description !== undefined) updates.description = description;

  const category = await Category.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!category) throw ApiError.notFound('Category not found');

  return new ApiResponse(200, { category }, 'Category updated').send(res);
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');
  return new ApiResponse(200, null, 'Category deleted').send(res);
});

/** Skills */
const createSkill = asyncHandler(async (req, res) => {
  const { name, category } = req.body;
  const skill = await Skill.create({ name, category: category || null });
  return new ApiResponse(201, { skill }, 'Skill created').send(res);
});

const getSkills = asyncHandler(async (req, res) => {
  const skills = await Skill.find().populate('category', 'name').sort('name');
  return new ApiResponse(200, { skills }, 'Skills fetched').send(res);
});

/** PATCH /api/v1/admin/skills/:id */
const updateSkill = asyncHandler(async (req, res) => {
  const { name, category } = req.body;
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (category !== undefined) updates.category = category || null;

  const skill = await Skill.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).populate('category', 'name');
  if (!skill) throw ApiError.notFound('Skill not found');

  return new ApiResponse(200, { skill }, 'Skill updated').send(res);
});

const deleteSkill = asyncHandler(async (req, res) => {
  const skill = await Skill.findByIdAndDelete(req.params.id);
  if (!skill) throw ApiError.notFound('Skill not found');
  return new ApiResponse(200, null, 'Skill deleted').send(res);
});

/**
 * GET /api/v1/admin/communications?status=&page=&limit=
 * Every ContactUnlock — i.e. every case where a company's HR has paid to
 * reveal a freelancer's direct contact details (name/email) and is now
 * able to communicate with them off-platform. This is the admin's view
 * into which companies are connected to which candidates, when the
 * connection was made, and what engagement (if any) they've logged.
 */
const getCommunications = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

  const [unlocks, total] = await Promise.all([
    ContactUnlock.find(filter)
      .populate('companyId', 'companyName email contactPerson')
      .populate('candidateId', 'name email headline')
      .populate('paymentId', 'amount paymentDate invoiceNumber')
      .sort('-unlockDate')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    ContactUnlock.countDocuments(filter),
  ]);

  return new ApiResponse(200, {
    communications: unlocks,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  }, 'Communications fetched').send(res);
});

/** GET /api/v1/admin/reviews - moderate reviews */
const getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .populate('candidateId', 'headline')
    .populate('companyId', 'companyName')
    .sort('-createdAt');
  return new ApiResponse(200, { reviews }, 'Reviews fetched').send(res);
});

const deleteReviewAsAdmin = asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndDelete(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');
  return new ApiResponse(200, null, 'Review removed').send(res);
});

module.exports = {
  getDashboardStats,
  getRevenueReport,
  getAllUsers,
  updateUserStatus,
  getAllCandidates,
  updateCandidateAsAdmin,
  deleteCandidateAsAdmin,
  getAllCompanies,
  updateCompanyAsAdmin,
  deleteCompanyAsAdmin,
  getAllPayments,
  getVerificationRequests,
  reviewVerificationRequest,
  getCommunications,
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  createSkill,
  getSkills,
  updateSkill,
  deleteSkill,
  getAllReviews,
  deleteReviewAsAdmin,
};
