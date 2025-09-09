const mongoose = require('mongoose');

const SecretSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  value: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Create a compound index to ensure a user cannot have two secrets with the same name
SecretSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Secret', SecretSchema);
