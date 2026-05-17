const mongoose = require('mongoose');

const goalItemSchema = new mongoose.Schema({
  thrustArea: String,
  title: String,
  description: String,
  uom: { 
    type: String, 
    enum: ['Numeric', '%', 'Timeline', 'Zero-based'] 
  },
  targetValue: Number,
  weightage: Number,
  type: { 
    type: String, 
    enum: ['Individual', 'Shared'] 
  },
  actualAchievements: {
    Q1: { type: Number, default: 0 },
    Q2: { type: Number, default: 0 },
    Q3: { type: Number, default: 0 },
    Q4: { type: Number, default: 0 }
  },
  status: {
    Q1: { type: String, default: 'Not Started' },
    Q2: { type: String, default: 'Not Started' },
    Q3: { type: String, default: 'Not Started' },
    Q4: { type: String, default: 'Not Started' }
  },
  managerComments: {
    Q1: { type: String, default: '' },
    Q2: { type: String, default: '' },
    Q3: { type: String, default: '' },
    Q4: { type: String, default: '' }
  }
});

const goalSheetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fiscalYear: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Draft', 'Pending Approval', 'Locked', 'Returned for Rework'], 
    default: 'Draft' 
  },
  items: [goalItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('GoalSheet', goalSheetSchema);
