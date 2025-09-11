const mongoose = require('mongoose');

const JourneySchema = new mongoose.Schema({
  name: { type: String, required: true },
  domain: { type: String, required: true, trim: true, index: true },
  steps: { type: Array, required: true },
  code: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lastRun: {
    status: { type: String, enum: ['success', 'failure', 'pending'], default: 'pending' },
    runAt: { type: Date },
    testResult: { type: mongoose.Schema.Types.ObjectId, ref: 'TestResult' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Journey', JourneySchema);
