/**
 * errorMiddleware.js
 *
 * Global Express error handler.
 *
 * - Returns standardised JSON: { error: { code, message, requestId } }
 * - Never leaks stack traces in production
 * - Handles known error classes (Mongoose validation, Clerk auth, etc.)
 */
function errorMiddleware(err, req, res, next) { // eslint-disable-line no-unused-vars
    const isProd = process.env.NODE_ENV === 'production';

    // --- Determine HTTP status ---
    let status = err.status || err.statusCode || 500;

    // Mongoose validation errors
    if (err.name === 'ValidationError') status = 400;
    // Mongoose bad ObjectId
    if (err.name === 'CastError' && err.kind === 'ObjectId') status = 400;
    // JWT / Clerk auth errors bubbled up
    if (err.message?.toLowerCase().includes('unauthorized')) status = 401;

    // --- Determine safe message ---
    let message = 'Internal Server Error';
    if (status < 500) {
        // Client errors: always safe to surface
        message = err.message || message;
    } else if (!isProd) {
        // Server errors in dev: surface the raw message for debugging
        message = err.message || message;
    }

    // --- Log server errors with stack ---
    if (status >= 500) {
        console.error('[ERROR]', req.method, req.path, status, err.stack || err.message);
    }

    res.status(status).json({
        error: {
            code: err.code || (status === 401 ? 'UNAUTHORIZED' : status === 403 ? 'FORBIDDEN' : status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR'),
            message,
            requestId: req.requestId || null,
        },
    });
}

module.exports = { errorMiddleware };
