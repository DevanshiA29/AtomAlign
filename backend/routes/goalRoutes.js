const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');

router.post('/submit', goalController.submitGoals);
router.post('/shared', goalController.pushSharedGoals);
router.patch('/approve/:id', goalController.approveGoalSheet);
router.get('/export', goalController.exportAchievements); // We can mount this under /api/reports as well

module.exports = router;
