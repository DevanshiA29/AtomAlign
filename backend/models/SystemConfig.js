const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  windows: {
    phase1: { type: Boolean, default: true },
    q1: { type: Boolean, default: true },
    q2: { type: Boolean, default: false },
    q3: { type: Boolean, default: false },
    q4: { type: Boolean, default: false }
  }
});

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
