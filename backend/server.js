require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { connectDB } = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(rateLimit({ windowMs: 15*60*1000, max: 300, message: 'Too many requests' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/public',   require('./routes/publicRoutes'));
app.use('/api/citizen',  require('./routes/citizenRoutes'));
app.use('/api/employee', require('./routes/employeeRoutes'));
app.use('/api/officer',  require('./routes/officerRoutes'));
app.use('/api/admin',    require('./routes/adminRoutes'));

app.get('/api/health', (req, res) => res.json({ status: 'NagrikSeva API Running ✅', version: '1.0.0' }));
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
connectDB().then(() => app.listen(PORT, () => console.log(`🚀 NagrikSeva Server running on port ${PORT}`)));
