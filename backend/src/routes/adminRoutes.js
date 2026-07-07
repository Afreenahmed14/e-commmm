const express = require('express');
const router = express.Router();

const admin = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const { ADMIN } = require('../constants/roles');

router.use(protect, authorize(ADMIN));

router.get('/dashboard', admin.getDashboardStats);
router.get('/revenue', admin.getRevenueReport);

router.get('/users', admin.getAllUsers);
router.patch('/users/:id/status', admin.updateUserStatus);

router.get('/candidates', admin.getAllCandidates);
router.patch('/candidates/:id', admin.updateCandidateAsAdmin);
router.delete('/candidates/:id', admin.deleteCandidateAsAdmin);

router.get('/companies', admin.getAllCompanies);
router.patch('/companies/:id', admin.updateCompanyAsAdmin);
router.delete('/companies/:id', admin.deleteCompanyAsAdmin);

router.get('/payments', admin.getAllPayments);

router.get('/verifications', admin.getVerificationRequests);
router.patch('/verifications/:id', admin.reviewVerificationRequest);

router.get('/communications', admin.getCommunications);

router.get('/categories', admin.getCategories);
router.post('/categories', admin.createCategory);
router.patch('/categories/:id', admin.updateCategory);
router.delete('/categories/:id', admin.deleteCategory);

router.get('/skills', admin.getSkills);
router.post('/skills', admin.createSkill);
router.patch('/skills/:id', admin.updateSkill);
router.delete('/skills/:id', admin.deleteSkill);

router.get('/reviews', admin.getAllReviews);
router.delete('/reviews/:id', admin.deleteReviewAsAdmin);

module.exports = router;
