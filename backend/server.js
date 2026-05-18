const express = require('express');
const cors = require('cors');
require('dotenv').config();

const goalRoutes = require('./routes/goalRoutes');
const adminRoutes = require('./routes/adminRoutes');
const portalRoutes = require('./routes/portalRoutes');
const path = require('path')
const app = express();

const dir = path.resolve();
app.use(cors());
app.use(express.json());

app.use('/api/goals', goalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports/achievements', adminRoutes);
app.use('/api/portal', portalRoutes);

const PORT = process.env.PORT || 5001;
const HOST = process.env.HOST || '127.0.0.1';

app.use(express.static(path.join(dir , "/frontend/dist")))
app.get(/_/,(_,res)=>{
  res.sendFile(path.resolve(dir,"frontend" , "dist" , "index.html"));
})
app.use((req, res) => {
    res.status(404).json({ 
        success: false,
        message: "Endpoint not found on AtomAlign API" 
    });
});
app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
