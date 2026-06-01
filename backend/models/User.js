const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  apiToken: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  settings: {
    notificationsEnabled: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: true }
  }
});

module.exports = mongoose.model('User', userSchema);
