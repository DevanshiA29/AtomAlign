const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/portal', adminController.getAdminPortalSnapshot);
router.get('/stream', adminController.streamAdminPortal);
router.post('/reset-demo', adminController.resetDemoData);
router.post('/users', adminController.createUser);
router.patch('/cycles/:cycleId', adminController.toggleCycleStatus);
router.patch('/reports/:employeeId/unlock', adminController.unlockEmployeeReports);
router.get('/dashboard', adminController.getDashboardData);
router.get('/hierarchy', adminController.getOrgHierarchy);
router.patch('/windows/:windowName', adminController.toggleWindow);
router.post('/goals/unlock/:employeeId', adminController.forceUnlockGoal);
router.post('/goals/shared-push', adminController.pushSharedGoal);
router.get('/export', adminController.exportAchievements);

module.exports = router;
