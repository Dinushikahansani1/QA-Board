const mongoose = require('mongoose');

const NotificationSettingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  journey: { type: mongoose.Schema.Types.ObjectId, ref: 'Journey', required: true },
  failureThreshold: { type: Number, default: 1 },
  emails: [{ type: String }],
  slackWebhookUrl: { type: String },
}, { timestamps: true });

// Ensure a user can only have one setting per journey
NotificationSettingSchema.index({ user: 1, journey: 1 }, { unique: true });

module.exports = mongoose.model('NotificationSetting', NotificationSettingSchema);
