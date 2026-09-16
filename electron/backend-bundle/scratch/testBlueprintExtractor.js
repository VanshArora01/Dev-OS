const { Groq } = require('groq-sdk');
require('dotenv').config({ path: '../.env' });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const fs = require('fs');

const blueprintJsonSchema = {
    name: "blueprint",
    strict: true,
    schema: {
        type: "object",
        properties: {
            project: {
                type: "object",
                properties: {
                    name: { type: ["string", "null"] },
                    summary: { type: ["string", "null"] },
                    objective: { type: ["string", "null"] },
                    problemStatement: { type: ["string", "null"] },
                    targetUsers: { type: ["string", "null"] },
                    projectType: { type: ["string", "null"] },
                    scope: { type: ["string", "null"] },
                    constraints: { type: ["string", "null"] }
                },
                required: ["name", "summary", "objective", "problemStatement", "targetUsers", "projectType", "scope", "constraints"],
                additionalProperties: false
            },
            requirements: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        id: { type: ["string", "null"] },
                        title: { type: ["string", "null"] },
                        description: { type: ["string", "null"] },
                        priority: { type: ["string", "null"] },
                        category: { type: ["string", "null"] },
                        source: { type: ["string", "null"] }
                    },
                    required: ["id", "title", "description", "priority", "category", "source"],
                    additionalProperties: false
                }
            },
            techStack: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        name: { type: ["string", "null"] },
                        category: { type: ["string", "null"] },
                        source: { type: ["string", "null"] }
                    },
                    required: ["name", "category", "source"],
                    additionalProperties: false
                }
            },
            phases: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        id: { type: ["string", "null"] },
                        name: { type: ["string", "null"] },
                        description: { type: ["string", "null"] },
                        order: { type: ["number", "null"] },
                        objectives: { type: "array", items: { type: "string" } },
                        dependencies: { type: "array", items: { type: "string" } }
                    },
                    required: ["id", "name", "description", "order", "objectives", "dependencies"],
                    additionalProperties: false
                }
            },
            tasks: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        title: { type: ["string", "null"] },
                        description: { type: ["string", "null"] },
                        phase: { type: ["string", "null"] },
                        phaseId: { type: ["string", "null"] },
                        priority: { type: ["string", "null"] },
                        dependencies: { type: "array", items: { type: "string" } },
                        requirementIds: { type: "array", items: { type: "string" } },
                        suggestedOrder: { type: ["number", "null"] },
                        status: { type: ["string", "null"] },
                        source: { type: ["string", "null"] }
                    },
                    required: ["title", "description", "phase", "phaseId", "priority", "dependencies", "requirementIds", "suggestedOrder", "status", "source"],
                    additionalProperties: false
                }
            },
            deliverables: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        name: { type: ["string", "null"] },
                        description: { type: ["string", "null"] },
                        relatedRequirements: { type: "array", items: { type: "string" } },
                        milestone: { type: ["string", "null"] },
                        source: { type: ["string", "null"] }
                    },
                    required: ["name", "description", "relatedRequirements", "milestone", "source"],
                    additionalProperties: false
                }
            },
            risks: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        title: { type: ["string", "null"] },
                        description: { type: ["string", "null"] },
                        severity: { type: ["string", "null"] },
                        mitigation: { type: ["string", "null"] },
                        source: { type: ["string", "null"] }
                    },
                    required: ["title", "description", "severity", "mitigation", "source"],
                    additionalProperties: false
                }
            },
            decisions: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        title: { type: ["string", "null"] },
                        description: { type: ["string", "null"] },
                        source: { type: ["string", "null"] }
                    },
                    required: ["title", "description", "source"],
                    additionalProperties: false
                }
            },
            deadlines: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        title: { type: ["string", "null"] },
                        date: { type: ["string", "null"] },
                        description: { type: ["string", "null"] },
                        source: { type: ["string", "null"] },
                        confidence: { type: ["string", "null"] }
                    },
                    required: ["title", "date", "description", "source", "confidence"],
                    additionalProperties: false
                }
            },
            brief: {
                type: "object",
                properties: {
                    overview: { type: ["string", "null"] },
                    problem: { type: ["string", "null"] },
                    objective: { type: ["string", "null"] },
                    targetUsers: { type: ["string", "null"] },
                    coreFeatures: { type: ["string", "null"] },
                    requirements: { type: ["string", "null"] },
                    scope: { type: ["string", "null"] },
                    constraints: { type: ["string", "null"] },
                    expectedDeliverables: { type: ["string", "null"] },
                    technology: { type: ["string", "null"] },
                    developmentDirection: { type: ["string", "null"] }
                },
                required: ["overview", "problem", "objective", "targetUsers", "coreFeatures", "requirements", "scope", "constraints", "expectedDeliverables", "technology", "developmentDirection"],
                additionalProperties: false
            }
        },
        required: ["project", "requirements", "techStack", "phases", "tasks", "deliverables", "risks", "decisions", "deadlines", "brief"],
        additionalProperties: false
    }
};


async function run() {
    try {
        const prdText = "A simple PRD for a task management app with React and Node.js. It needs user authentication, project creation, and tasks. We will deploy on Docker.";
        // Just directly call Groq with the blueprint extractor schema
        const response = await groq.chat.completions.create({
            model: "openai/gpt-oss-20b",
            messages: [{ role: "user", content: prdText }],
            response_format: { type: "json_schema", json_schema: blueprintJsonSchema }
        });
        console.log("Success:", response.choices[0].message.content.substring(0, 50));
    } catch (e) {
        console.log("Failed:", e);
    }
}
run();
