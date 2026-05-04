const mongoose = require('mongoose');

const vmSchema = new mongoose.Schema({
  vmId: { type: Number, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: { type: String, required: true, lowercase: true, trim: true },
  status: { type: String, default: 'provisioning' },
  os: { type: String, default: 'ubuntu-22.04' },
  plan: { type: String, default: 'Professional' },
  cpuCores: { type: Number, default: 2 },
  ramMb: { type: Number, default: 2048 },
  diskGb: { type: Number, default: 40 },
  ip: { type: String, default: null },
  buildUrl: { type: String, default: null },
  buildNumber: { type: Number, default: null },
  lastStatusCheckedAt: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Vm', vmSchema);
