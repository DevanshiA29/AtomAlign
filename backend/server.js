const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const goalRoutes = require('./routes/goalRoutes');
const adminRoutes = require('./routes/adminRoutes');
const portalRoutes = require('./routes/portalRoutes');

const app = express();
const dir = path.resolve();

// 1. Global Middlewares
app.use(cors());
app.use(express.json());

// 2. API Routes
app.use('/api/goals', goalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports/achievements', adminRoutes);
app.use('/api/portal', portalRoutes);

// 3. Serve Frontend Static Assets (Vite Production Build)
app.use(express.static(path.join(dir, "frontend", "dist")));

// 4. SPA Wildcard Fallback Route
// This catches all navigation requests and passes them to Vite client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.resolve(dir, "frontend", "dist", "index.html"));
});

// 5. Global 404 Fallback for Non-Existent API Endpoints 
// (Only triggers if a request didn't match the API routes or the frontend files)
app.use((req, res) => {
    res.status(404).json({ 
        success: false,
        message: "Endpoint not found on AtomAlign API" 
    });
});

// 6. Server Initialization & Network Binding
const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || '0.0.0.0'; // Bound to 0.0.0.0 for Render port discovery

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});

// const express = require('express');
// const cors = require('cors');
// require('dotenv').config();

// const goalRoutes = require('./routes/goalRoutes');
// const adminRoutes = require('./routes/adminRoutes');
// const portalRoutes = require('./routes/portalRoutes');
// const path = require('path')
// const app = express();

// const dir = path.resolve();
// app.use(cors());
// app.use(express.json());

// app.use('/api/goals', goalRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/reports/achievements', adminRoutes);
// app.use('/api/portal', portalRoutes);

// const PORT = process.env.PORT || 5001;
// const HOST = process.env.HOST || '0.0.0.0';

// app.use(express.static(path.join(dir , "/frontend/dist")))
// app.get(/_/,(_,res)=>{
//   res.sendFile(path.resolve(dir,"frontend" , "dist" , "index.html"));
// })
// app.use((req, res) => {
//     res.status(404).json({ 
//         success: false,
//         message: "Endpoint not found on AtomAlign API" 
//     });
// });
// app.listen(PORT, HOST, () => {
//   console.log(`Server running on http://${HOST}:${PORT}`);
// });
