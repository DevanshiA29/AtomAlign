const express = require('express');
const router = express.Router();
const portalController = require('../controllers/portalController');

// Employee Endpoints
router.post('/session-user', portalController.syncPortalUser);
router.get('/managers', portalController.getManagers);
router.get('/profile', portalController.getUserProfile);
router.patch('/profile/:userId', portalController.updateUserProfile);
router.get('/my-sheets', portalController.getEmployeeSheet);
router.post('/my-sheet', portalController.saveEmployeeSheet);
router.delete('/goal/:goalId', portalController.deleteGoal);

// Manager Endpoints
router.get('/queue', portalController.getManagerQueue);
router.patch('/sheet/:sheetId/status', portalController.updateSheetStatus);
router.patch('/sheet/:sheetId/feedback', portalController.saveFeedback);

module.exports = router;
