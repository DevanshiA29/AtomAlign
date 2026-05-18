// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const goalRoutes = require('./routes/goalRoutes');
const adminRoutes = require('./routes/adminRoutes');
const portalRoutes = require('./routes/portalRoutes');

const app = express();
const ROOT = path.resolve();
const FRONTEND_DIST = path.join(ROOT, 'frontend', 'dist');
const INDEX_HTML = path.join(FRONTEND_DIST, 'index.html');

// --- 1. Middlewares
app.use(cors());
app.use(express.json());

// Optional: small health endpoint for platform health checks
app.get('/health', (_req, res) => res.status(200).json({ success: true, uptime: process.uptime() }));

// --- 2. API routes (always register API routes first)
app.use('/api/goals', goalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports/achievements', adminRoutes);
app.use('/api/portal', portalRoutes);

// If an /api route wasn't matched, return JSON 404 (prevents SPA fallback from catching API calls)
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found on AtomAlign API'
  });
});

// --- 3. Serve frontend if build exists, otherwise run API-only mode
if (fs.existsSync(INDEX_HTML)) {
  app.use(express.static(FRONTEND_DIST));

  // SPA fallback for non-API routes.
  // Use a regex to avoid path-to-regexp issues with '*' on some hosts.
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(INDEX_HTML);
  });

  console.log('Serving frontend from:', FRONTEND_DIST);
} else {
  console.warn('Warning: frontend/dist/index.html not found. Running API-only mode.');
  // Provide a simple root message so visiting the root is informative
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      message: 'AtomAlign API running. Frontend build not found on server.'
    });
  });
}

// --- 4. Final catch-all 404 (safety net)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found on AtomAlign API'
  });
});

// --- 5. Start server
const PORT = parseInt(process.env.PORT, 10) || 5001;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
