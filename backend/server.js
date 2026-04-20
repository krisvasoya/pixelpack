const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const crawlRouter = require('./routes/crawl');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));

// CORS — allow frontend origin
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '1mb' }));

// Rate limiting — 10 crawl requests per IP per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many requests. Please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/crawl', limiter);

// Routes
const apiPrefix = process.env.BACKEND_BASE_PATH || '';

// If apiPrefix is set (e.g. /_/backend), we also want to match routes without it for local dev
const router = express.Router();

router.use('/api', crawlRouter);

router.get('/api/test', (req, res) => {
  res.json({ message: "Backend working 🚀", timestamp: new Date().toISOString() });
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', service: 'PixelPack Backend' });
});

app.use(apiPrefix, router);
if (apiPrefix) {
  app.use('/', router); // Also support root for local dev
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 PixelPack backend running on port ${PORT}`);
});

module.exports = app;
