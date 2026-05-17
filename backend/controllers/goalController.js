const GoalSheet = require('../models/GoalSheet');
const User = require('../models/User');

// POST /api/goals/submit
exports.submitGoals = async (req, res) => {
    try {
        const { userId, fiscalYear, items } = req.body;
        
        // Validation: Max goal limit per employee is 8
        if (!items || items.length > 8) {
            return res.status(400).json({ error: 'Maximum goal limit is 8.' });
        }

        // Validation: Total weightage must be exactly 100%
        const totalWeightage = items.reduce((sum, item) => sum + (item.weightage || 0), 0);
        if (totalWeightage !== 100) {
            return res.status(400).json({ error: 'Total weightage must be exactly 100%.' });
        }

        // Validation: Min individual goal weightage >= 10%
        const invalidWeightage = items.some(item => item.type === 'Individual' && item.weightage < 10);
        if (invalidWeightage) {
            return res.status(400).json({ error: 'Individual goals must have a minimum weightage of 10%.' });
        }

        let sheet = await GoalSheet.findOne({ userId, fiscalYear });
        if (sheet) {
            // Update existing
            if (sheet.status === 'Locked') {
                return res.status(403).json({ error: 'Goal sheet is locked and cannot be modified.' });
            }
            sheet.items = items;
            sheet.status = 'Pending Approval';
            await sheet.save();
        } else {
            // Create new
            sheet = new GoalSheet({
                userId,
                fiscalYear,
                items,
                status: 'Pending Approval'
            });
            await sheet.save();
        }

        res.status(200).json({ message: 'Goals submitted successfully', data: sheet });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST /api/goals/shared
exports.pushSharedGoals = async (req, res) => {
    try {
        const { targetUserIds, fiscalYear, sharedGoalItem } = req.body;
        
        // targetUserIds is an array of Employee User IDs
        // sharedGoalItem contains thrustArea, title, targetValue, etc. (type will be 'Shared')
        
        // Update all sheets for these users
        for (const userId of targetUserIds) {
            let sheet = await GoalSheet.findOne({ userId, fiscalYear });
            
            if (sheet) {
                if (sheet.status !== 'Locked') {
                    // Check if already exists to avoid duplicates
                    const exists = sheet.items.find(i => i.title === sharedGoalItem.title && i.type === 'Shared');
                    if (!exists) {
                        // Push new shared item. Note: This might exceed 100% weightage,
                        // which would force the employee to readjust their individual goals.
                        sheet.items.push({ ...sharedGoalItem, type: 'Shared' });
                        await sheet.save();
                    }
                }
            } else {
                // Create a draft sheet with just the shared goal
                sheet = new GoalSheet({
                    userId,
                    fiscalYear,
                    items: [{ ...sharedGoalItem, type: 'Shared' }],
                    status: 'Draft'
                });
                await sheet.save();
            }
        }

        res.status(200).json({ message: 'Shared goals pushed successfully to targets.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// PATCH /api/goals/approve/:id
exports.approveGoalSheet = async (req, res) => {
    try {
        const { id } = req.params;
        const sheet = await GoalSheet.findById(id);
        
        if (!sheet) {
            return res.status(404).json({ error: 'Goal sheet not found.' });
        }

        sheet.status = 'Locked';
        await sheet.save();

        res.status(200).json({ message: 'Goal sheet approved and locked.', data: sheet });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/reports/achievements/export
exports.exportAchievements = async (req, res) => {
    try {
        const { fiscalYear } = req.query;
        
        const sheets = await GoalSheet.find({ fiscalYear }).populate('userId', 'name email department');
        
        const exportData = [];
        
        sheets.forEach(sheet => {
            sheet.items.forEach(item => {
                exportData.push({
                    EmployeeName: sheet.userId.name,
                    Department: sheet.userId.department,
                    FiscalYear: sheet.fiscalYear,
                    GoalTitle: item.title,
                    Type: item.type,
                    Weightage: item.weightage,
                    Target: item.targetValue,
                    ActualQ1: item.actualAchievements.Q1,
                    ActualQ2: item.actualAchievements.Q2,
                    ActualQ3: item.actualAchievements.Q3,
                    ActualQ4: item.actualAchievements.Q4,
                    Status: sheet.status
                });
            });
        });
        
        res.status(200).json({ data: exportData });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
