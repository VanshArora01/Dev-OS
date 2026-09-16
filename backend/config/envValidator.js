/**
 * envValidator.js
 *
 * Validates that all critical environment variables are present before the server
 * accepts any traffic. Call validateEnv() at the very top of server.js (after
 * dotenv.config()) to make misconfiguration a hard startup failure rather than
 * a silent runtime error.
 */

const REQUIRED_VARS = [
    { key: 'CLERK_SECRET_KEY',           hint: 'Clerk dashboard → API Keys' },
    { key: 'INTEGRATION_ENCRYPTION_KEY', hint: 'Run: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\')"' },
];

/** Checks that at least one of these is set (db.js accepts either) */
const REQUIRED_ONE_OF = [
    {
        keys: ['MONGO_URI', 'MONGODB_URI'],
        hint: 'MongoDB Atlas connection string (set MONGODB_URI)'
    },
];

function validateEnv() {
    const missingLines = [];

    // All-required vars
    REQUIRED_VARS.forEach(({ key, hint }) => {
        if (!process.env[key]) {
            missingLines.push(`  • ${key}  (hint: ${hint})`);
        }
    });

    // Any-one-of groups
    REQUIRED_ONE_OF.forEach(({ keys, hint }) => {
        if (!keys.some((k) => process.env[k])) {
            missingLines.push(`  • ${keys.join(' or ')}  (hint: ${hint})`);
        }
    });

    if (missingLines.length > 0) {
        console.error('\n[FATAL] Missing required environment variables:\n');
        missingLines.forEach((l) => console.error(l));
        console.error(
            '\nSet these variables in your .env file (development) or deployment environment (production).\n'
        );
        process.exit(1);
    }
}

module.exports = { validateEnv };
