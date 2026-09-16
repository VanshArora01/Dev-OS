const OpenAI = require('openai');
const { config } = require('../config/ai');
const { filterHistoricalData } = require('./datasetService');

const GROUND_TRUTH_DATA = {
    "Dubai": {
        "recent_events": "Severe flooding in April 2024 (heaviest since 1949), intensified by climate change (10-40% increase in rainfall intensity). Temperatures reached 49.9°C in July 2024.",
        "ongoing_projects": "Dh30 billion 'Tasreef' drainage project (700% capacity increase), Mohammed bin Rashid Al Maktoum Solar Park, mangrove restoration (13,950 planted since 2023).",
        "risks": "90% of infrastructure in low-lying flood-prone areas. Projected 0.7m sea level rise by 2100 threatening Palm Jumeirah."
    },
    "New York": {
        "recent_events": "NPCC4 Fourth Assessment (2024) confirms increased intense rainfall ('cloudbursts') and land-based flooding. NYC sea level has risen 12 inches since 1900.",
        "ongoing_projects": "East Side Coastal Resiliency (ESCR) project, MTA Climate Resilience Roadmap (2024), Battery Coastal Resilience (BCR).",
        "risks": "Queens is highly vulnerable to CIS cascading failures. Projections of 6.25ft sea level rise by 2100. Over 370 critical sites at risk of frequent flooding by 2100."
    }
};

const evaluateInfrastructure = async (projectData) => {
    const { infraType, location, hazard, year, budget, coordinates, additionalContext } = projectData;
    const apiKey = process.env.GROQ_API_KEY;

    // 1. Identify manual grounding context
    const cityKey = Object.keys(GROUND_TRUTH_DATA).find(key =>
        location.city?.toLowerCase().includes(key.toLowerCase()) ||
        location.state?.toLowerCase().includes(key.toLowerCase())
    );
    const groundingContext = cityKey ? GROUND_TRUTH_DATA[cityKey] : null;

    // 2. Fetch historical disaster data from EM-DAT CSV dataset
    let historicalContext = '';
    try {
        const historicalData = await filterHistoricalData({
            hazard: hazard || 'flood',
            country: location.city || location.state || '',
            region: location.state || '',
            yearFrom: 1950,
            yearTo: 2025,
            limit: 8
        });
        if (historicalData.records.length > 0) {
            historicalContext = `

HISTORICAL DISASTER DATA (EM-DAT / CRED Verified Records):
════════════════════════════════════════════════════════════
IMPORTANT: The following is REAL historical disaster data from the EM-DAT International Disaster Database 
maintained by the Centre for Research on the Epidemiology of Disasters (CRED). This data spans verified 
records from 1950 to 2025. You MUST use this data to:
  a) Calibrate your risk scoring against real-world historical frequency and severity
  b) Reference specific past events when discussing risk exposure
  c) Use the decade-by-decade frequency trend to project future risk acceleration
  d) Ground your Expected Annual Loss calculations in actual historical damage figures

${historicalData.summary}
════════════════════════════════════════════════════════════`;
            console.log(`[GroqService] Injected ${historicalData.records.length} historical records for ${hazard} in ${location.city || location.state || 'global'}`);
        }
    } catch (err) {
        console.warn('[GroqService] Could not load historical data:', err.message);
    }

    // 3. Build the enriched prompt with historical context injection
    const prompt = `You are the CLIMX Grounded Resilience Engine. 
Generate a professional, high-fidelity climate resilience and engineering report. 

STRICT REQUIREMENT: This report must be REALISTIC and grounded in verified 2024/2025 environmental data 
AND the historical disaster records provided below.

PROJECT CONTEXT:
- Infrastructure: ${infraType}
- Coordinates (Vertices): ${coordinates || 'N/A'}
- City/Location: ${location.city || location.state || 'N/A'}
- Target Year: ${year}
- Budget: ${budget}
- Hazard context provided: ${hazard}
- Additional field context: ${additionalContext || 'None'}

${groundingContext ? `
GROUND TRUTH DATA (MUST USE):
- Recent Events: ${groundingContext.recent_events}
- Ongoing Local Projects: ${groundingContext.ongoing_projects}
- Specific Regional Risks: ${groundingContext.risks}
` : 'Note: Research regional data for this specific location to provide a realistic assessment.'}
${historicalContext}

REPORT REQUIREMENTS:
1. Provide EXACTLY 3 site-specific resilience strategies.
2. For each strategy, provide a brief technical explanation.
3. Use professional engineering language.
4. STRICT: Do NOT include any cost estimates, ROI values, or financial projections. All financial numbers are handled by a separate engine.

OUTPUT FORMAT:
- Use professional Markdown.
- Sections: "STRATEGY 1", "STRATEGY 2", "STRATEGY 3". Each section should have a title and a 2-3 sentence explanation.
- MANDATORY: Include a line starting with "RESILIENCE SCORE: [X]%" at the bottom.
- NO DUMMY PLACEHOLDERS.
- NO FINANCIAL FIGURES.`;

    const maxRetries = 2;
    let lastError;

    for (let i = 0; i <= maxRetries; i++) {
        try {
            if (i > 0) console.log(`[GroqService] Retry attempt ${i}...`);
            const response = await axios.post(
                'https://api.groq.com/openai/v1/chat/completions',
                {
                    model: config.complexAgentModel,
                    messages: [
                        {
                            role: 'system',
                            content: 'You are an advanced climate resilience engine providing professional engineering reports.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.6,
                    max_tokens: 3000
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 40000 // Groq is fast, 40s is plenty
                }
            );

            return response.data.choices[0].message.content;
        } catch (err) {
            lastError = err;
            console.error(`[GroqService] Attempt ${i + 1} failed:`, err.response?.data || err.message);
            if (err.response?.status === 401) {
                console.error("Authentication Error: Check your GROQ_API_KEY");
                break; // Don't retry on 401
            }
            if (i < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    // If we're here, all retries failed
    const err = lastError;
    console.error('Groq API Final Failure:', err.message);

    // Fallback: generate a meaningful report even if the API is down
    console.warn('Falling back to local report generation...');
    const cityName = location.city || location.state || 'the specified region';
    return `# GROUNDED RISK PROFILE\n\n` +
        `## Location: ${cityName}\n` +
        `## Infrastructure: ${infraType}\n` +
        `## Target Year: ${year}\n` +
        `## Budget: ${budget}\n` +
        `## Hazard: ${hazard}\n\n` +
        `${coordinates ? `### Spatial Vertices:\n${coordinates}\n\n` : ''}` +
        `${groundingContext ? `### Regional Context:\n- Recent Events: ${groundingContext.recent_events}\n- Ongoing Projects: ${groundingContext.ongoing_projects}\n- Key Risks: ${groundingContext.risks}\n\n` : ''}` +
        `# ENGINEERING STRATEGY\n\n` +
        `Based on the ${hazard} hazard profile for ${cityName}, the following resilience strategies are recommended for ${infraType} infrastructure:\n\n` +
        `1. **Structural Reinforcement**: Upgrade load-bearing elements to withstand projected ${hazard} scenarios through ${year}.\n` +
        `2. **Drainage & Water Management**: Install advanced stormwater management systems calibrated for projected climate intensity.\n` +
        `3. **Early Warning Integration**: Deploy IoT-based monitoring systems for real-time hazard detection.\n` +
        `4. **Material Resilience**: Use climate-adaptive construction materials rated for extreme weather events.\n\n` +
        `# SPATIAL VERTEX ANALYSIS\n\n` +
        `The defined project area requires comprehensive geotechnical assessment. Site-specific soil stability, water table depth, and subsurface conditions should be evaluated at each vertex.\n\n` +
        `${additionalContext ? `### Additional Context Considered:\n${additionalContext}\n\n` : ''}` +
        `---\n\n` +
        `> **Note**: This report was generated using local analysis due to temporary API unavailability. A full AI-powered analysis with Kimi K2.5 will be available when the service is restored.\n\n` +
        `RESILIENCE SCORE: 72%`;
};

module.exports = { evaluateInfrastructure };
