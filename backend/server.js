require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/auth');
const journeyRoutes = require('./src/routes/journeys');
const importRoutes = require('./src/routes/import');
const notificationSettingsRoutes = require('./src/routes/notificationSettings');
const templateRoutes = require('./src/routes/templates');
const secretRoutes = require('./src/routes/secrets');
const scheduler = require('./src/services/scheduler');

const app = express();
app.use(helmet());

// More flexible CORS configuration for development
const whitelist = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (whitelist.indexOf(origin) !== -1 || (process.env.CLIENT_URL && origin === process.env.CLIENT_URL)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/journeys', journeyRoutes);
app.use('/api/import', importRoutes);
app.use('/api/notification-settings', notificationSettingsRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/secrets', secretRoutes);


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
