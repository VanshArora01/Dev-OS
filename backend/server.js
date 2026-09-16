require('dotenv').config();

// P0.9: Fail fast if critical env vars are missing
const { validateEnv } = require('./config/envValidator');
validateEnv();

const express = require('express');
const cors = require('cors');
const dns = require('dns');
const rateLimit = require('express-rate-limit');

const { requestLogger } = require('./middleware/requestLogger');
const { errorMiddleware } = require('./middleware/errorMiddleware');

// CRITICAL: Set DNS servers FIRST to solve MongoDB SRV and host resolution issues in restricted networks
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    console.log('Global DNS servers set to Google Public DNS');
} catch (e) {
    console.warn('Warning: Could not set global DNS servers:', e.message);
}

const projectRoutes = require('./routes/projectRoutes');
const communityRoutes = require('./routes/communityRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const aiRoutes = require('./routes/aiRoutes');
const { validateAiConfig } = require('./config/ai');
const automationRoutes = require('./routes/automationRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const dbConnector = require('./config/db');
const { cleanupStaleArtifacts } = require('./services/capabilities/document/artifactStore');
const { checkReminders } = require('./services/emailService');

const app = express();
const PORT = process.env.PORT || 5000;

// P1.5: Connect to Database first, then start background jobs
dbConnector()
    .then(() => {
        // Only run background jobs after DB is connected
        checkReminders();
        // Run reminder check every hour
        setInterval(checkReminders, 1000 * 60 * 60);
        validateAiConfig();
        console.log('[Startup] Background jobs started');
    })
    .catch((err) => {
        console.error('[FATAL] Database connection failed on startup:', err.message);
        process.exit(1);
    });

// Cleanup stale generated document artifacts periodically
cleanupStaleArtifacts();
setInterval(cleanupStaleArtifacts, 6 * 60 * 60 * 1000);

// ── Middleware ────────────────────────────────────────────────────────────────

// Attach requestId to every request and log basic stats
app.use(requestLogger);

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8081',
    process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error(`CORS Error: Origin ${origin} is not allowed by configuration.`));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-clerk-id'],
}));

// P0.5: Reduce global JSON limit to 2 MB (specific large-payload routes override below)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));

// P0.6: Rate limiting — in-memory store for single-instance deployment.
// TODO: Replace `store` with a Redis store (e.g. rate-limit-redis) when running multiple instances.

/** General API limiter — 200 req/15 min per IP */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' } },
});

/** Stricter limiter for AI/session-analysis endpoints — 30 req/15 min per IP */
const aiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'AI request limit reached. Please wait before sending more requests.' } },
});

const { requireClerkUser } = require('./utils/auth');

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/projects', apiLimiter, requireClerkUser, projectRoutes);
app.use('/api/community', apiLimiter, requireClerkUser, communityRoutes);
app.use('/api/subscription', apiLimiter, requireClerkUser, subscriptionRoutes);
app.use('/api/sessions', apiLimiter, requireClerkUser, sessionRoutes);
app.use('/api/dashboard', apiLimiter, requireClerkUser, dashboardRoutes);
app.use('/api/ai', aiLimiter, requireClerkUser, aiRoutes);
app.use('/api/automation', apiLimiter, requireClerkUser, automationRoutes);
app.use('/api/integrations', apiLimiter, integrationRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'DevOS API' });
});

// P0.9: Standardised global error handler (must be last)
app.use(errorMiddleware);

app.listen(PORT, () => {
    console.log(`[DevOS] Server is running on port ${PORT}`);
});
