const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  adminId: { type: String, required: true },
  targetNode: { type: String, required: true },
  actionEvent: { type: String, required: true },
  priorState: { type: String },
  newState: { type: String }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
