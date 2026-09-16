const dotenv = require('dotenv');
const { Groq } = require('groq-sdk');
dotenv.config();

const config = {
    agentModel: process.env.GROQ_AGENT_MODEL || 'openai/gpt-oss-20b',
    complexAgentModel: process.env.GROQ_COMPLEX_AGENT_MODEL || 'openai/gpt-oss-20b',
    capabilityModel: process.env.GROQ_CAPABILITY_MODEL || 'openai/gpt-oss-20b',
    summaryModel: process.env.GROQ_SUMMARY_MODEL || 'openai/gpt-oss-20b',
    intentModel: process.env.GROQ_INTENT_MODEL || 'openai/gpt-oss-20b',
    blueprintModel: 'gemini-2.5-flash', // routed to Gemini
    visionModel: process.env.GROQ_VISION_MODEL || 'qwen/qwen3.8-27b'
};

async function validateAiConfig() {
    console.log('[AI Config]');
    console.log(`Agent: ${config.agentModel}`);
    console.log(`Complex Agent: ${config.complexAgentModel}`);
    console.log(`Capability: ${config.capabilityModel}`);
    console.log(`Summary: ${config.summaryModel}`);
    console.log(`Intent: ${config.intentModel}`);
    console.log(`Blueprint: ${config.blueprintModel}`);
    console.log(`Vision: ${config.visionModel}`);

    // Verify Gemini Key
    if (!process.env.GEMINI_API_KEY) {
        console.error('[AI] CONFIGURATION FAILURE: GEMINI_API_KEY is not configured in environment variables');
    } else {
        console.log('[AI] Blueprint provider (Gemini): PASS');
    }

    const requiredGroqModels = [
        config.agentModel,
        config.complexAgentModel,
        config.capabilityModel,
        config.summaryModel,
        config.intentModel,
        config.visionModel
    ];

    const uniqueGroqModels = [...new Set(requiredGroqModels)];

    if (uniqueGroqModels.some(m => m.includes('llama-'))) {
        console.error('[AI] CONFIGURATION FAILURE: Obsolete llama- model detected in configuration!');
    }

    try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY, maxRetries: 1 });
        const res = await groq.models.list();
        const availableModels = res.data.map(m => m.id);
        
        let allAvailable = true;
        for (const model of uniqueGroqModels) {
            if (!availableModels.includes(model)) {
                console.error(`[AI] MODEL UNAVAILABLE: ${model}`);
                allAvailable = false;
            }
        }

        if (allAvailable) {
            console.log('[AI] Groq model availability: PASS');
        } else {
            console.log('[AI] Model availability check: FAIL - Some configured models are not accessible.');
        }
    } catch (err) {
        console.log('[AI] Model availability check: DEGRADED');
        console.log('[AI] Groq unavailable — AI requests will retry when invoked.', err.message);
    }
}

module.exports = {
    config,
    validateAiConfig
};
