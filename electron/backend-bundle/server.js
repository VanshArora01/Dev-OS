require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');

// CRITICAL: Set DNS servers FIRST to solve MongoDB SRV and host resolution issues in restricted networks
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    console.log('Global DNS servers set to Google Public DNS');
} catch (e) {
    console.warn('Warning: Could not set global DNS servers:', e.message);
}


const { checkReminders } = require('./services/emailService');

// Run reminder check every hour
setInterval(checkReminders, 1000 * 60 * 60);

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

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
dbConnector()
    .then(() => {
        // Run once on startup after DB connects
        checkReminders();
        validateAiConfig();
    })
    .catch((err) => {
        console.error("Database connection failed on startup:", err);
    });

// Cleanup stale generated document artifacts periodically
cleanupStaleArtifacts();
setInterval(cleanupStaleArtifacts, 6 * 60 * 60 * 1000);

// Middleware
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8081',
    process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        console.log(`[CORS Check] Incoming Origin: ${origin}`);
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`[CORS Check] Blocked Origin: ${origin}`);
            callback(new Error(`CORS Error: Origin ${origin} is not allowed by configuration.`));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-clerk-id']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/projects', projectRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/integrations', integrationRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('--- GLOBAL ERROR HANDLER ---');
    console.error(err.stack);
    console.error('----------------------------');
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Hello world route
app.get('/', (req, res) => {
    res.send('DevOS Backend is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

 
 
