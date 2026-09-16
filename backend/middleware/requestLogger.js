const { randomUUID } = require('crypto');

/**
 * requestLogger.js
 *
 * Attaches a unique requestId to every incoming request and logs basic
 * request stats (method, path, status, duration). In production the
 * requestId is included in error responses so support can correlate
 * user-reported issues to server logs.
 */
function requestLogger(req, res, next) {
    req.requestId = randomUUID();
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';
        console.log(
            `[${level}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms requestId=${req.requestId}`
        );
    });

    next();
}

module.exports = { requestLogger };
