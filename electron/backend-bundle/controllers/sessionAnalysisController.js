const { GoogleGenerativeAI } = require("@google/generative-ai");
const { config } = require('../config/ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


const analyzeSession = async (req, res) => {
  try {
    const { images, duration, projectContext } = req.body;

    if (!images || images.length === 0) {
      return res.status(400).json({ error: "No images provided" });
    }

    console.log(`[Analysis] Initializing for ${projectContext.name}. Images: ${images.length}`);
    
    // Attempt Primary Analysis (Gemini 1.5 Pro - Powerful Vision)
    try {
      console.log(`[Analysis] Attempting Gemini 1.5 Pro (Latest). Images: ${images.length}`);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
      const prompt = `You are analyzing ${images.length} chronological screenshots from a developer work session of ${duration} minutes.

PROJECT CONTEXT:
- Project: ${projectContext.name} (${projectContext.type})
- Description: ${projectContext.description}
- Last planned next step: ${projectContext.lastNextStep || "Not set"}

INSTRUCTIONS:
- Look at ALL screenshots carefully in order — first to last.
- The FIRST screenshot shows what the developer started with.
- The LAST screenshot shows where they ended up.
- Track what changed between screenshots to understand what was actually done.
- Be specific — mention actual file names, component names, error messages, or UI elements you can see.
- DO NOT make up work that isn't visible — only report what you actually see.
- CRITICAL: DO NOT repeat the project description, target users, or generic tech stack in your summary unless you actually saw the developer changing those things. Your summary must describe the developer's concrete activity and the differences between the screenshots.
- If screenshots show mostly the same thing, note the developer was focused on one task.

Respond ONLY with valid JSON, no markdown, no explanation:
{
  "summary": "Specific description of what was built or worked on, based ONLY on what you actually saw happening in the screenshots, omitting project background context.",
  "problemsFaced": "Any error messages, bugs, or issues visible in screenshots. Empty string if none visible.",
  "decisionsMade": "Any architectural or technical choices visible from code or browser changes. Empty string if unclear.",
  "nextStep": "The most logical next step based on where the last screenshot left off",
  "toolsUsed": ["list of tools/apps visible: VS Code, browser, terminal, Figma, etc."],
  "minutesEstimate": ${duration}
}`;

      const parts = [
        { text: prompt },
        ...images.map(img => ({
          inlineData: {
            data: img.base64,
            mimeType: img.mimeType || "image/png"
          }
        }))
      ];

      const result = await model.generateContent(parts);
      const responseText = result.response.text();
      const clean = responseText.match(/\{[\s\S]*\}/)?.[0] || responseText;
      const parsed = JSON.parse(clean);
      return res.json({ analysis: parsed, provider: "gemini-pro" });

    } catch (proError) {
      console.warn("[Analysis] Gemini Pro Error, attempting Gemini Flash fallback:", proError.message);
      
      try {
        const flashModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        const parts = [
            { text: `Analyze this developer work node based ONLY on what you actually see changing in the screenshots. Do NOT summarize the project description. Summary must be technically accurate. Duration: ${duration}m. Project: ${projectContext.name}. Respond in JSON format only.` },
            ...images.map(img => ({
              inlineData: {
                data: img.base64,
                mimeType: img.mimeType || "image/png"
              }
            }))
        ];
        const flashResult = await flashModel.generateContent(parts);
        const flashParsed = JSON.parse(flashResult.response.text().match(/\{[\s\S]*\}/)?.[0] || flashResult.response.text());
        return res.json({ analysis: flashParsed, provider: "gemini-flash" });

      } catch (flashError) {
        console.warn("[Analysis] Gemini Flash failed, attempting Groq fallback:", flashError.message);
        
        try {
          const axios = require("axios");
          // Groq fallback: Use top 3 representative images (start, middle, end)
          const groqSamples = [images[0], images[Math.floor(images.length / 2)], images[images.length - 1]].filter(Boolean);
          
          const groqResponse = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
              model: config.visionModel,
              messages: [{
                role: "user",
                content: [
                  { type: "text", text: `Analyze this dev session (${duration}m). Project: ${projectContext.name}. Report ONLY what you see changing in the images. Do not repeat project descriptions. Return JSON only.` },
                  ...groqSamples.map(img => ({ type: "image_url", image_url: { url: `data:image/png;base64,${img.base64}` } }))
                ]
              }],
              response_format: { type: "json_object" }
            },
            { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, timeout: 15000 }
          );

          const parsed = JSON.parse(groqResponse.data.choices[0].message.content);
          return res.json({ analysis: parsed, provider: "groq" });
        } catch (groqError) {
           // ... (fail-safe mock remains the same below)
          const mockAnalysis = {
            summary: `Completed a focus session on ${projectContext.name}. Work cycle recorded across multiple modules.`,
            problemsFaced: "None reported by telemetry.",
            decisionsMade: "Maintained architectural alignment.",
            nextStep: projectContext.lastNextStep || "Review changes.",
            toolsUsed: ["IDE", "Terminal"],
            minutesEstimate: duration || 10
          };
          return res.json({ analysis: mockAnalysis, provider: "fail-safe-mock", error: "AI services offline" });
        }
      }
    }

  } catch (error) {
    console.error("Critical Analysis Error:", error.message);
    res.status(500).json({ error: "Intelligence systems offline. Manual entry required." });
  }
};

module.exports = {
  analyzeSession
};
