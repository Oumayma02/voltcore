const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vm: { type: mongoose.Schema.Types.ObjectId, ref: 'Vm', default: null },
  vmId: { type: Number, default: null },
  type: { type: String, enum: ['success', 'warning', 'error', 'info'], default: 'info' },
  title: { type: String, required: true, trim: true },
  detail: { type: String, required: true, trim: true },
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
