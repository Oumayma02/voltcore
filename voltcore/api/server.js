require('dotenv').config();               // ← add this line
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const path     = require('path');
const vmRoutes = require('./routes/vms');
const authRoutes = require('./routes/auth');
const notificationRoutes = require('./routes/notifications');
const infraRoutes = require('./routes/infra');
const { connectDb } = require('./services/db');
const { attachTerminalServer } = require('./services/terminal');
const { startLifecycleMonitor } = require('./services/lifecycle');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(morgan('combined'));

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));
app.use('/api/auth', authRoutes);
app.use('/api/vms', vmRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/infra', infraRoutes);

const appDir = process.env.FRONTEND_DIR || path.resolve(__dirname, '..', 'app');
app.use(express.static(appDir));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  return res.sendFile(path.join(appDir, 'index.html'));
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: err.message }); });

connectDb()
  .then(() => {
    const server = app.listen(PORT, '0.0.0.0', () => console.log(`VoltCore API running on port ${PORT}`));
    attachTerminalServer(server);
    startLifecycleMonitor();
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
