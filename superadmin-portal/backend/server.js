const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const { seedSuperAdmin } = require('./controllers/authController');
const { seedPackages } = require('./controllers/packageController');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// Trust reverse proxies (Render / Cloudflare / Vercel)
app.set('trust proxy', 1);

// Allowed Origins for SuperAdmin Portal
const allowedOrigins = [
  'https://billing-software-progix.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // 1. Allow desktop apps, mobile clients, or server-to-server calls (no browser Origin header)
    if (!origin || origin === 'null') {
      return callback(null, true);
    }
    // 2. Allow explicitly configured domains or *.vercel.app deployments
    const isAllowed = allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin);
    if (isAllowed) {
      return callback(null, true);
    }
    return callback(new Error(`Blocked by CORS policy: Origin ${origin} is not authorized.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Security Middlewares
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use('/api', apiLimiter);

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

// Global Error Handler (Catch CORS & other uncaught errors cleanly)
app.use((err, req, res, next) => {
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ success: false, message: err.message });
  }
  console.error('[API Error]:', err.message);
  res.status(500).json({ success: false, message: 'Internal Server Error' });
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
