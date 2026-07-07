const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const Candidate = require('../models/Candidate');
const Company = require('../models/Company');
const ContactUnlock = require('../models/ContactUnlock');
const { VISIBILITY, UNLOCK_STATUS } = require('../constants/status');

/**
 * GET /api/v1/stats
 * Public, unauthenticated platform totals for the landing page's social-proof
 * bar. Deliberately minimal — only counts, nothing revenue-related or
 * otherwise sensitive (that lives behind the admin dashboard instead).
 */
const getPlatformStats = asyncHandler(async (req, res) => {
  const [totalCandidates, totalCompanies, totalUnlocks] = await Promise.all([
    Candidate.countDocuments({ visibility: VISIBILITY.PUBLIC }),
    Company.countDocuments(),
    ContactUnlock.countDocuments({ status: UNLOCK_STATUS.ACTIVE }),
  ]);

  return new ApiResponse(200, {
    totalCandidates,
    totalCompanies,
    totalUnlocks,
  }, 'Platform stats fetched').send(res);
});

module.exports = { getPlatformStats };
