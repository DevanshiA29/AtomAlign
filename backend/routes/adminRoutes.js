const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/dashboard', adminController.getDashboardData);
router.get('/hierarchy', adminController.getOrgHierarchy);
router.patch('/windows/:windowName', adminController.toggleWindow);
router.post('/goals/unlock/:employeeId', adminController.forceUnlockGoal);
router.post('/goals/shared-push', adminController.pushSharedGoal);

// For the export route, we'll put it here, but server.js mounts it at /api/reports/achievements 
// Wait, the prompt says "GET /api/reports/achievements/export". I will put it in adminRoutes and export it.
router.get('/export', adminController.exportAchievements);

module.exports = router;
