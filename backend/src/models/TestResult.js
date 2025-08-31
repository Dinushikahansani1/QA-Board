const mongoose = require('mongoose');

const TestResultSchema = new mongoose.Schema({
  journey: { type: mongoose.Schema.Types.ObjectId, ref: 'Journey', required: true },
  status: { type: String, enum: ['success', 'failure'], required: true },
  logs: { type: String },
  screenshot: { type: String } // URL or path to the screenshot
}, { timestamps: true });

module.exports = mongoose.model('TestResult', TestResultSchema);
