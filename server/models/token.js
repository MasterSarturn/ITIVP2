const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  token: { type: String, required: true, unique: true },
  type: { type: String, enum: ['access', 'refresh'], required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Token', tokenSchema);
