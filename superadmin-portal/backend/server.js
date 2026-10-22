const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { seedSuperAdmin } = require('./controllers/authController');
const { seedPackages } = require('./controllers/packageController');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const licenseRoutes = require('./routes/licenseRoutes');
const packageRoutes = require('./routes/packageRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/license', licenseRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'PRO Billing SuperAdmin Cloud API', time: new Date() });
});

// Root friendly welcome
app.get('/', (req, res) => {
  res.send('<h3>PRO Billing Software - Cloud Centralized SuperAdmin & License Server is Running.</h3>');
});

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();
    await seedSuperAdmin();
    await seedPackages();

    app.listen(PORT, () => {
      console.log(`[SuperAdmin Cloud Server] Running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start SuperAdmin server:', err.message);
  }
};

startServer();
