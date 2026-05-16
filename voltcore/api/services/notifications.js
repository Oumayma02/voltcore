const Notification = require('../models/Notification');

async function notify({ user, vm = null, vmId = null, type = 'info', title, detail }) {
  if (!user || !title || !detail) return null;
  return Notification.create({ user, vm, vmId, type, title, detail });
}

module.exports = { notify };
