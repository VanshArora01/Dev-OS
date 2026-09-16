const axios = require('axios');
const { Groq } = require('groq-sdk');
const { config } = require('../config/ai');

/**
 * Common headers for Groq API
 */
const getGroqHeaders = (apiKey) => ({
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
});

// Current production model with vision capabilities
const VISION_MODEL = config.visionModel;

/**
 * Periodic screen analyzer (observational)
 */
const analyzeScreen = async (base64Image) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        console.error('[VisionService] GROQ_API_KEY not set');
        return { summary: "API key missing.", nextStep: "Configure GROQ_API_KEY." };
    }

    const base64Content = base64Image.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `You are a developer assistant. Look at this screenshot of a developer's workstation.
        1. Summarize current work in 1 short sentence (e.g. "Editing React component for login").
        2. Identify the most likely 'Next Step'.
        3. If the user is implementing a new feature not yet completed, name it.
        
        OUTPUT JSON ONLY:
        {
          "summary": "...",
          "nextStep": "...",
          "newFeatureFound": "Optional: Name of new feature if detected"
        }`;

    console.log(`[VisionService] Sending to ${VISION_MODEL}. Image Base64 Length: ${base64Content.length}`);

    try {
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: VISION_MODEL,
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Content}` } }
                    ]
                }],
                response_format: { type: "json_object" },
                temperature: 0.1
            },
            { headers: getGroqHeaders(apiKey), timeout: 30000 }
        );
        const rawContent = response.data.choices[0].message.content;
        console.log('[VisionService] AI Response:', rawContent);
        return JSON.parse(rawContent);
    } catch (err) {
        console.error('[VisionService] API Failure:', {
            status: err.response?.status,
            data: err.response?.data,
            message: err.message
        });
        return { 
            summary: "Vision analysis unavailable.", 
            nextStep: "Check API configuration." 
        };
    }
};

/**
 * Interactive assistant query (conversational)
 */
const processAssistantQuery = async (queryText, base64Image) => {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        return { answer: "API key not configured.", action: "none" };
    }

    const base64Content = base64Image ? base64Image.replace(/^data:image\/\w+;base64,/, '') : null;

    const prompt = `You are an AI assistant in DevOS. The user says: "${queryText}". 
        The context is their current screen (attached).
        
        GOAL: Help the user with their work and update project metadata.
        
        ACTIONS:
        - If the user wants to add something to their goals/deliverables, return action 'add_deliverable' and the deliverable name.
        - If they ask for an evaluation (e.g. 'does it fulfill needs?'), give a professional 2-sentence review.
        
        OUTPUT JSON ONLY:
        {
          "answer": "Your spoken response to the user via TTS",
          "action": "Optional: 'add_deliverable', 'none'",
          "deliverable": "Name of deliverable if action is add_deliverable"
        }`;

    const content = [{ type: 'text', text: prompt }];
    if (base64Content) {
        content.push({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Content}` } });
    }

    try {
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: VISION_MODEL,
                messages: [{ role: 'user', content }],
                response_format: { type: "json_object" }
            },
            { headers: getGroqHeaders(apiKey) }
        );
        return JSON.parse(response.data.choices[0].message.content);
    } catch (err) {
        console.error('[VisionAssistant] Error:', err.response?.data || err.message);
        return { answer: "I encountered a processing error. Could you repeat that?", action: "none" };
    }
};

module.exports = { analyzeScreen, processAssistantQuery };
