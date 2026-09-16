const dotenv = require('dotenv');
const { Groq } = require('groq-sdk');
dotenv.config();

const config = {
    agentModel: process.env.GROQ_AGENT_MODEL || 'openai/gpt-oss-20b',
    complexAgentModel: process.env.GROQ_COMPLEX_AGENT_MODEL || 'openai/gpt-oss-20b',
    capabilityModel: process.env.GROQ_CAPABILITY_MODEL || 'openai/gpt-oss-20b',
    summaryModel: process.env.GROQ_SUMMARY_MODEL || 'openai/gpt-oss-20b',
    intentModel: process.env.GROQ_INTENT_MODEL || 'openai/gpt-oss-20b',
    blueprintModel: process.env.GROQ_BLUEPRINT_MODEL || 'openai/gpt-oss-20b',
    visionModel: process.env.GROQ_VISION_MODEL || 'qwen/qwen3.6-27b'
};

async function validateAiConfig() {
    console.log('[AI] Configuration loaded');
    console.log(`[AI] Agent: ${config.agentModel}`);
    console.log(`[AI] Blueprint: ${config.blueprintModel}`);
    console.log(`[AI] Intent: ${config.intentModel}`);
    console.log(`[AI] Summary: ${config.summaryModel}`);
    console.log(`[AI] Vision: ${config.visionModel}`);

    const requiredModels = [...new Set(Object.values(config))];
    
    if (requiredModels.some(m => m.includes('llama-'))) {
        console.error('[AI] CONFIGURATION FAILURE: Obsolete llama- model detected in configuration!');
    }

    try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY, maxRetries: 1 });
        const res = await groq.models.list();
        const availableModels = res.data.map(m => m.id);
        
        let allAvailable = true;
        for (const model of requiredModels) {
            if (!availableModels.includes(model)) {
                console.error(`[AI] MODEL UNAVAILABLE: ${model}`);
                allAvailable = false;
            }
        }

        if (allAvailable) {
            console.log('[AI] Model availability: PASS');
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
