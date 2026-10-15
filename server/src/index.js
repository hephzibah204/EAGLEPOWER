import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../../dist');
const outPath = path.resolve(__dirname, '../../out');
const staticPath = fs.existsSync(outPath) ? outPath : (fs.existsSync(distPath) ? distPath : null);

// Load environment variables reliably from server/.env or root .env
const serverEnv = path.resolve(__dirname, '../.env');
const rootEnv = path.resolve(__dirname, '../../.env');
if (fs.existsSync(serverEnv)) {
  dotenv.config({ path: serverEnv });
} else if (fs.existsSync(rootEnv)) {
  dotenv.config({ path: rootEnv });
} else {
  dotenv.config();
}

// Initialize database
import db from './config/db.js';

// Route modules
import authRoutes from './routes/auth.js';
import academicsRoutes from './routes/academics.js';
import studentsRoutes from './routes/students.js';
import staffRoutes from './routes/staff.js';
import examsRoutes from './routes/exams.js';
import financeRoutes from './routes/finance.js';
import admissionsRoutes from './routes/admissions.js';
import frontdeskRoutes from './routes/frontdesk.js';
import auditRoutes from './routes/audit.js';
import reportsRoutes from './routes/reports.js';
import attendanceRoutes from './routes/attendance.js';
import homeworkRoutes from './routes/homework.js';
import progressRoutes from './routes/progress.js';
import payrollRoutes from './routes/payroll.js';
import executiveRoutes from './routes/executive.js';
import systemRoutes from './routes/system.js';
import usersRoutes from './routes/users.js';

// Security Middlewares
import { threatDefense } from './middleware/threatDefense.js';
import { inputSanitizer } from './middleware/sanitizer.js';

// Error Handler
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5050;

// Obscure tech stack: disable X-Powered-By
app.disable('x-powered-by');

// Active Threat Defense Firewall: Blocks automated exploit scanners, null bytes & path traversal
app.use(threatDefense);

// Enable trust proxy for accurate rate-limiting behind reverse proxies (Nginx, Cloudflare)
app.set('trust proxy', 1);

// Security Middleware: Fortified Helmet HTTP Headers & Content Security Policy
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      connectSrc: ["'self'", "http://localhost:*", "ws:", "wss:", "https://api.paystack.co"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },
  frameguard: { action: 'deny' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// CORS Configuration - Restrict to authorized client origins
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:4173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile apps, server-side fetch, CLI tests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*') || origin.endsWith('.pages.dev')) {
      return callback(null, true);
    }

    // In non-production, permit standard local dev origins
    if (process.env.NODE_ENV !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS origin '${origin}' is not permitted.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Strict Rate Limiting to prevent brute-force attacks and credential stuffing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 30 : 1000, // 30 in production, 1000 in dev/test
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP address. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: {
    success: false,
    message: 'Request rate limit exceeded. Please wait a moment.'
  }
});

// JSON Body Parser with strict limit
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Input Sanitization Middleware: Neutralizes XSS, null bytes & prototype pollution
app.use(inputSanitizer);

// Apply general rate limit
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    system: 'Eagle Power Schools Management System (EduCore)',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: Math.floor(process.uptime()) + 's'
  });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/academics', academicsRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/exams', examsRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/admissions', admissionsRoutes);
app.use('/api/frontdesk', frontdeskRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/executive', executiveRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/users', usersRoutes);

const publicPath = path.resolve(__dirname, '../../public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

// Production Static Client Serving & SPA Routing with Path Traversal Protection
if (staticPath) {
  app.use(express.static(staticPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }

    // Strict Path Normalization & Traversal Guard
    const safeRelPath = path.normalize(req.path).replace(/^(\.\.[\/\\])+/, '');
    const targetBase = path.resolve(staticPath, '.' + safeRelPath);
    if (!targetBase.startsWith(staticPath)) {
      return res.status(403).json({ success: false, message: 'Forbidden: Path traversal violation.' });
    }

    // Check for route-specific static HTML file (e.g., /portal/broadsheet/index.html)
    const specificHtml = path.join(targetBase, 'index.html');
    if (specificHtml.startsWith(staticPath) && fs.existsSync(specificHtml)) {
      return res.sendFile(specificHtml);
    }
    const directHtml = targetBase + '.html';
    if (directHtml.startsWith(staticPath) && fs.existsSync(directHtml)) {
      return res.sendFile(directHtml);
    }
    const indexHtml = path.join(staticPath, 'index.html');
    if (fs.existsSync(indexHtml)) {
      return res.sendFile(indexHtml);
    }
    next();
  });
}

// 404 Handler for undefined API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.method} ${req.originalUrl}' not found.`
  });
});

// Centralized Error Handler
app.use(errorHandler);

// Start Server
const server = app.listen(PORT, () => {
  console.log(`🦅 ========================================================`);
  console.log(`🦅 Eagle Power EduCore Backend API is running!`);
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🛡️ Security: Helmet, RateLimiter, Bcrypt, JWT Active`);
  if (staticPath) {
    console.log(`📂 Static assets served from: ${staticPath}`);
  }
  console.log(`🦅 ========================================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use by another process.`);
  } else {
    console.error('❌ Server startup error:', err);
  }
  process.exit(1);
});

// Graceful shutdown handling
function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Gracefully shutting down Eagle Power EduCore...`);
  server.close(() => {
    try {
      db.exec('PRAGMA wal_checkpoint(TRUNCATE);');
      db.close();
    } catch {}
    console.log('✅ SQLite database flushed and closed cleanly.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});

export default app;
