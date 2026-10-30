/**
 * ChronicOne — Express Backend Server
 * Simple, readable, and human-friendly backend for chronic habit tracking.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust reverse proxy in production (Render, Heroku, AWS ELB load balancers)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Middleware for parsing JSON, form-data, and cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CSRF Defense: Enforces origin verification on state-changing requests
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.headers.origin;
    const host = req.get('host');
    if (origin) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return res.status(403).json({ error: 'CSRF validation failed: Cross-origin request not permitted.' });
        }
      } catch (e) {
        return res.status(403).json({ error: 'CSRF validation failed: Malformed Origin header.' });
      }
    }
  }
  next();
});

// Serve all frontend files from the 'frontend' folder
app.use(express.static(path.join(__dirname, '../frontend')));

// Health Check Endpoint (Server and Database Status)
app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? 'healthy' : 'degraded',
    server: 'running',
    database: isDbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// MVC ROUTE REGISTRATION
// ============================================================================

const authRoutes = require('./routes/authRoutes');
const checkInRoutes = require('./routes/checkInRoutes');
const streakRoutes = require('./routes/streakRoutes');
const healthRoutes = require('./routes/healthRoutes');
const wellnessRoutes = require('./routes/wellnessRoutes');

// 1. Authentication
app.use('/api/auth', authRoutes);
app.use('/api', authRoutes); // backward compatibility for /api/register and /api/login

// 2. Check-Ins & Streaks
app.use('/api/checkin', checkInRoutes);
app.use('/api/streak', streakRoutes);

// 3. Health Biomarkers & Vitals
app.use('/api/health-records', healthRoutes);
app.use('/api/vitals', healthRoutes);

// 4. Mood & Wellness
app.use('/api/wellness', wellnessRoutes);


// Start the Server and connect to MongoDB Atlas
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`✅ ChronicOne server running at: http://localhost:${PORT}`);
  });
};

startServer();

module.exports = app;

