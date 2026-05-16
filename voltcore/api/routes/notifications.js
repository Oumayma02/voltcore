const express = require('express');
const { authRequired } = require('../middleware/auth');
const Notification = require('../models/Notification');

const router = express.Router();

router.get('/', authRequired, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(80);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/read', authRequired, async (req, res) => {
  try {
    const { ids } = req.body || {};
    const query = { user: req.user._id };
    if (Array.isArray(ids) && ids.length) query._id = { $in: ids };
    await Notification.updateMany(query, { read: true });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/', authRequired, async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
