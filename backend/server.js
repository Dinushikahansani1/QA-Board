require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/auth');
const journeyRoutes = require('./src/routes/journeys');
const importRoutes = require('./src/routes/import');
const notificationSettingsRoutes = require('./src/routes/notificationSettings');
const scheduler = require('./src/services/scheduler');

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/journeys', journeyRoutes);
app.use('/api/import', importRoutes);
app.use('/api/notification-settings', notificationSettingsRoutes);

const http = require('http');
const webSocketService = require('./src/services/websocket');

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);
webSocketService.init(server);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Auth backend listening on :${PORT}`);
    scheduler.start();
  });
}).catch(err => {
  console.error('DB connect error', err);
  process.exit(1);
});
