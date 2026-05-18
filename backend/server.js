
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
const dir = path.resolve();
const frontendDist = path.join(dir, 'frontend', 'dist');
const indexHtml = path.join(frontendDist, 'index.html');

// 1. Global middlewares
app.use(cors());
app.use(express.json());

// 2. API routes
app.use('/api/goals', goalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports/achievements', adminRoutes);
app.use('/api/portal', portalRoutes);

// 3. API-only 404 handler for unmatched /api routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found on AtomAlign API'
  });
});

// 4. Serve frontend static assets only if build exists
if (fs.existsSync(indexHtml)) {
  app.use(express.static(frontendDist));

  // SPA fallback for non-API routes
  // Use a regex to avoid the '*' path-to-regexp bug on some platforms
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(indexHtml);
  });

  console.log('Frontend static assets served from', frontendDist);
} else {
  // If frontend build is missing, log a clear warning and keep API running
  console.warn('Warning: frontend/dist/index.html not found. Running API-only mode.');
  // Optional simple root route to indicate service is live
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'AtomAlign API running. Frontend build not found on server.'
    });
  });
}

// 5. Final catch-all 404 (safety net)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found on AtomAlign API'
  });
});

// 6. Start server
const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});

// // server.js
// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const path = require('path');

// const goalRoutes = require('./routes/goalRoutes');
// const adminRoutes = require('./routes/adminRoutes');
// const portalRoutes = require('./routes/portalRoutes');

// const app = express();
// const dir = path.resolve();

// // 1. Global middlewares
// app.use(cors());
// app.use(express.json());

// // 2. API routes
// app.use('/api/goals', goalRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/reports/achievements', adminRoutes);
// app.use('/api/portal', portalRoutes);

// // 3. API-only 404 handler
// // If a request starts with /api and didn't match any route above, return JSON 404.
// app.use('/api', (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'Endpoint not found on AtomAlign API'
//   });
// });

// // 4. Serve frontend static assets (Vite production build)
// const staticPath = path.join(dir, 'frontend', 'dist');
// app.use(express.static(staticPath));

// // 5. SPA fallback for non-API routes
// // Use a regex that excludes paths starting with /api to avoid path-to-regexp issues.
// // This prevents the wildcard from being interpreted in a way that causes PathError.
// app.get(/^\/(?!api).*/, (req, res) => {
//   res.sendFile(path.join(staticPath, 'index.html'));
// });

// // 6. Final catch-all 404 (should rarely be reached because /api 404 and SPA fallback exist)
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: 'Endpoint not found on AtomAlign API'
//   });
// });

// // 7. Start server
// const PORT = process.env.PORT || 5001;
// const HOST = process.env.HOST || '0.0.0.0';

// app.listen(PORT, HOST, () => {
//   console.log(`Server running on http://${HOST}:${PORT}`);
// });


// // const express = require('express');
// // const cors = require('cors');
// // const path = require('path');
// // require('dotenv').config();

// // const goalRoutes = require('./routes/goalRoutes');
// // const adminRoutes = require('./routes/adminRoutes');
// // const portalRoutes = require('./routes/portalRoutes');

// // const app = express();
// // const dir = path.resolve();

// // // 1. Global Middlewares
// // app.use(cors());
// // app.use(express.json());

// // // 2. API Routes
// // app.use('/api/goals', goalRoutes);
// // app.use('/api/admin', adminRoutes);
// // app.use('/api/reports/achievements', adminRoutes);
// // app.use('/api/portal', portalRoutes);

// // // 3. Serve Frontend Static Assets (Vite Production Build)
// // app.use(express.static(path.join(dir, "frontend", "dist")));

// // // 4. SPA Wildcard Fallback Route
// // // This catches all navigation requests and passes them to Vite client-side routing
// // app.get('*', (req, res) => {
// //   res.sendFile(path.resolve(dir, "frontend", "dist", "index.html"));
// // });

// // // 5. Global 404 Fallback for Non-Existent API Endpoints 
// // // (Only triggers if a request didn't match the API routes or the frontend files)
// // app.use((req, res) => {
// //     res.status(404).json({ 
// //         success: false,
// //         message: "Endpoint not found on AtomAlign API" 
// //     });
// // });

// // // 6. Server Initialization & Network Binding
// // const PORT = process.env.PORT || 5001;
// // const HOST = process.env.HOST || '0.0.0.0'; // Bound to 0.0.0.0 for Render port discovery

// // app.listen(PORT, HOST, () => {
// //   console.log(`Server running on http://${HOST}:${PORT}`);
// // });

// // // const express = require('express');
// // // const cors = require('cors');
// // // require('dotenv').config();

// // // const goalRoutes = require('./routes/goalRoutes');
// // // const adminRoutes = require('./routes/adminRoutes');
// // // const portalRoutes = require('./routes/portalRoutes');
// // // const path = require('path')
// // // const app = express();

// // // const dir = path.resolve();
// // // app.use(cors());
// // // app.use(express.json());

// // // app.use('/api/goals', goalRoutes);
// // // app.use('/api/admin', adminRoutes);
// // // app.use('/api/reports/achievements', adminRoutes);
// // // app.use('/api/portal', portalRoutes);

// // // const PORT = process.env.PORT || 5001;
// // // const HOST = process.env.HOST || '0.0.0.0';

// // // app.use(express.static(path.join(dir , "/frontend/dist")))
// // // app.get(/_/,(_,res)=>{
// // //   res.sendFile(path.resolve(dir,"frontend" , "dist" , "index.html"));
// // // })
// // // app.use((req, res) => {
// // //     res.status(404).json({ 
// // //         success: false,
// // //         message: "Endpoint not found on AtomAlign API" 
// // //     });
// // // });
// // // app.listen(PORT, HOST, () => {
// // //   console.log(`Server running on http://${HOST}:${PORT}`);
// // // });
