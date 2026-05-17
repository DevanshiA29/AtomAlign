const express = require('express');
const cors = require('cors');
require('dotenv').config();

const goalRoutes = require('./routes/goalRoutes');
const adminRoutes = require('./routes/adminRoutes');
const portalRoutes = require('./routes/portalRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/goals', goalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports/achievements', adminRoutes);
app.use('/api/portal', portalRoutes);

const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || '127.0.0.1';

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
