const { Groq } = require('groq-sdk');
const dotenv = require('dotenv');
dotenv.config();

let groqInstance = null;
function getGroqClient() {
    if (!groqInstance) {
        groqInstance = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return groqInstance;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class SafeAiError extends Error {
    constructor(code, originalError, message = '') {
        super(message || originalError?.message || code);
        this.code = code;
        this.originalError = originalError;
        this.name = 'SafeAiError';
    }
}

/**
 * Safe wrapper for Groq chat completions
 * Handles retries, timeout translation, and safe error masking.
 */
async function safeGroqCompletion(requestConfig, options = {}) {
    const groq = getGroqClient();
    const maxRetries = options.retries !== undefined ? options.retries : 2;
    const baseDelay = 1000;

    let attempt = 0;
    while (true) {
        attempt++;
        try {
            const completion = await groq.chat.completions.create(requestConfig);
            return completion;
        } catch (error) {
            const isLastAttempt = attempt > maxRetries;
            
            // Determine if error is retryable
            const status = error?.status || error?.response?.status;
            let errorCode = 'AI_PROVIDER_ERROR';
            let isRetryable = false;

            if (error?.error?.code === 'insufficient_quota' || status === 429) {
                errorCode = 'AI_RATE_LIMITED';
                isRetryable = true; // Retry rate limit with backoff
            } else if (status === 401 || status === 403) {
                errorCode = 'AI_AUTH_FAILED';
                isRetryable = false; // Never retry auth
            } else if (status === 404) {
                errorCode = 'AI_MODEL_UNAVAILABLE';
                isRetryable = false; // Never retry missing model
            } else if (status >= 500) {
                errorCode = 'AI_PROVIDER_UNAVAILABLE';
                isRetryable = true; // Retry server errors
            } else if (error?.name === 'TimeoutError' || error.message?.includes('timeout') || error.message?.includes('fetch failed')) {
                errorCode = 'AI_TIMEOUT';
                isRetryable = true; // Retry network failures
            } else if (error.message && error.message.includes('json_validate_failed')) {
                errorCode = 'AI_STRUCTURED_OUTPUT_INVALID';
                isRetryable = false; // Do not repeatedly retry schema failures without modifying prompt
            } else if (status === 400) {
                errorCode = 'AI_BAD_REQUEST';
                isRetryable = false; 
            }

            // If we cannot retry or ran out of attempts, throw our safe error
            if (!isRetryable || isLastAttempt) {
                console.error(`[GroqClient] Failed after ${attempt} attempts. Error Code: ${errorCode}. Detail:`, error.message);
                throw new SafeAiError(errorCode, error, `AI Service Failed: ${errorCode}`);
            }

            // Exponential backoff
            const delay = baseDelay * Math.pow(2, attempt - 1);
            console.warn(`[GroqClient] Attempt ${attempt} failed (${errorCode}). Retrying in ${delay}ms...`);
            await sleep(delay);
        }
    }
}

module.exports = {
    getGroqClient,
    safeGroqCompletion,
    SafeAiError
};
