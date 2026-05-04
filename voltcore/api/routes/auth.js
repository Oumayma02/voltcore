const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authRequired, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

function issueToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, JWT_SECRET, { expiresIn: '12h' });
}

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, plan } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const existing = await User.findOne({ email: String(email).toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const firstUser = (await User.countDocuments({ role: 'admin' })) === 0;
    const user = await User.create({
      name,
      email,
      passwordHash,
      plan: plan || 'Professional',
      role: firstUser ? 'admin' : 'user'
    });

    res.status(201).json({ token: issueToken(user), user: user.toSafeJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    res.json({ token: issueToken(user), user: user.toSafeJSON() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authRequired, (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

router.get('/users', authRequired, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin role required' });
  const users = await User.find().sort({ createdAt: 1 });
  res.json(users.map(user => user.toSafeJSON()));
});

module.exports = router;
