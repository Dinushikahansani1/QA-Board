const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  journey: { type: mongoose.Schema.Types.ObjectId, ref: 'Journey', required: true },
  testResult: { type: mongoose.Schema.Types.ObjectId, ref: 'TestResult', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'cleared'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('Alert', AlertSchema);
