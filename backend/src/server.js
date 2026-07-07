require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const Admin = require('./models/Admin');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route modules
const authRoutes = require('./routes/authRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const companyRoutes = require('./routes/companyRoutes');
const adminRoutes = require('./routes/adminRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app = express();

// ---- Security & parsing middleware ----
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Global rate limiter (auth routes have a stricter one layered on top)
app.use(
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ---- Health check ----
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ success: true, message: 'HourlyRecruit API is running', data: { timestamp: new Date() }, errors: [] });
});

// ---- API routes ----
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/candidates', candidateRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/uploads', uploadRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/stats', statsRoutes);

// ---- Error handling (must be last) ----
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

/**
 * Dev convenience only: auto-creates a default admin account on startup so
 * you don't have to run seed.js by hand. This still goes through the real
 * login flow (email + password are checked normally) — it just guarantees
 * the account exists. Skipped in production; never overwrites an existing
 * admin, including one you've since renamed/repassworded.
 */
const ensureDefaultAdmin = async () => {
  if (process.env.NODE_ENV === 'production') return;

  const DEFAULT_ADMIN_EMAIL = 'admin@gmail.com';
  const DEFAULT_ADMIN_PASSWORD = 'admin1234';

  const existing = await Admin.findOne({ email: DEFAULT_ADMIN_EMAIL });
  if (existing) return;

  await Admin.create({
    name: 'Admin',
    email: DEFAULT_ADMIN_EMAIL,
    password: DEFAULT_ADMIN_PASSWORD,
    isVerified: true,
  });
  console.log(`[Seed] Default admin ready → ${DEFAULT_ADMIN_EMAIL} / ${DEFAULT_ADMIN_PASSWORD} (dev only, change before deploying)`);
};

const startServer = async () => {
  await connectDB();
  await ensureDefaultAdmin();
  app.listen(PORT, () => {
    console.log(`[Server] HourlyRecruit API listening on port ${PORT} (${process.env.NODE_ENV})`);
  });
};

startServer();

// Graceful shutdown
process.on('unhandledRejection', (err) => {
  console.error(`[UnhandledRejection] ${err.message}`);
  process.exit(1);
});

module.exports = app;
