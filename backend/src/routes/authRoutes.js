const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const {
  registerCandidate, registerCompany,
  loginCandidate, loginCompany, loginAdmin,
  logout, refresh, getMe, forgotPassword, resetPassword,
} = require('../controllers/authController');
const {
  firebaseAuthCandidate, firebaseAuthCompany, firebaseAuthAdmin,
} = require('../controllers/firebaseAuthController');
const { protect } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const {
  registerCandidateValidator, registerCompanyValidator, loginValidator,
  forgotPasswordValidator, resetPasswordValidator,
} = require('../validators/authValidator');
const { firebaseAuthValidator } = require('../validators/firebaseAuthValidator');

// Stricter rate limit on auth endpoints to slow down credential-stuffing/brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts, please try again later', data: null, errors: [] },
});

// Candidates and companies are separate collections (see models/Candidate.js),
// so each gets its own register/login endpoint rather than one generic
// "role in the body" endpoint — this also lets each role's login page hit
// a URL that matches its own flow.
router.post('/candidate/register', authLimiter, registerCandidateValidator, validateRequest, registerCandidate);
router.post('/candidate/login', authLimiter, loginValidator, validateRequest, loginCandidate);

router.post('/company/register', authLimiter, registerCompanyValidator, validateRequest, registerCompany);
router.post('/company/login', authLimiter, loginValidator, validateRequest, loginCompany);

// No public admin registration — admins are provisioned directly in the DB
// or via a seed script (see docs/DEPLOYMENT.md).
router.post('/admin/login', authLimiter, loginValidator, validateRequest, loginAdmin);

// Firebase-verified sign-in (Google / Phone-OTP / Email-link), one endpoint
// per role. Same rate limiter as the local login/register routes above.
// Candidate/company: creates the account on first sign-in if none matches;
// admin: only links/logs in an already-provisioned account, never creates one.
router.post('/candidate/firebase', authLimiter, firebaseAuthValidator, validateRequest, firebaseAuthCandidate);
router.post('/company/firebase', authLimiter, firebaseAuthValidator, validateRequest, firebaseAuthCompany);
router.post('/admin/firebase', authLimiter, firebaseAuthValidator, validateRequest, firebaseAuthAdmin);

// Shared across all roles — role is derived from the authenticated token.
router.post('/logout', protect, logout);
router.post('/refresh', refresh);
router.get('/me', protect, getMe);
router.post('/forgot-password', authLimiter, forgotPasswordValidator, validateRequest, forgotPassword);
router.post('/reset-password', authLimiter, resetPasswordValidator, validateRequest, resetPassword);

module.exports = router;
