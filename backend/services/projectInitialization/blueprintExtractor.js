const { GoogleGenerativeAI } = require('@google/generative-ai');
const { config } = require('../../config/ai');
const { safeGroqCompletion, SafeAiError } = require('../groqClient');
const {
    normalizePriority,
    normalizeTaskStatus,
    normalizeTechCategory,
    normalizeTechSource,
    slugId,
    isNonEmptyString
} = require('./projectBlueprintSchema');


const EXTRACTION_PROMPT = `Analyze the COMPLETE PRD below and extract a structured project blueprint. The output schema is enforced automatically — populate every field accurately.

CRITICAL INSTRUCTIONS:
1. CONCISENESS & LIMITS: This is a lightweight initialization.
   - MAXIMUM INITIAL KANBAN TASKS = 10. Prefer between 6 and 10 high-value tasks. Do NOT exceed 10 tasks.
   - Tasks must represent actual implementation milestones (e.g. project setup, auth, database schema, core APIs, core UI, key features, integration, testing, deployment, final validation).
   - If the PRD only supports fewer (e.g. 5) tasks, only output that many. Do not force 10.
   - MAXIMUM REQUIREMENTS = 10. Extract only top 6-10 core requirements.
   - Keep ALL description/summary fields extremely brief (max 1-2 sentences, under 15 words).
2. DO NOT INVENT/SPECULATE:
   - Do NOT invent requirements, technologies, deadlines, risks, decisions, or milestones not explicitly supported by the PRD.
   - If information is not in the PRD, use null or empty arrays.
   - Technologies: only include EXPLICITLY mentioned ones.
   - Deadlines: only include EXPLICITLY stated dates. Never invent dates.
3. INVARIANTS:
   - All tasks must have status "todo".
   - Every requirement, task, tech item, risk, and decision MUST include a short "source" field citing the PRD section (e.g. "PRD → Auth").`;

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


function validateDataAgainstSchema(data, schema, path = 'root') {
    const errors = [];

    if (!schema) return errors;

    // Resolve expected types
    let expectedTypes = [];
    if (typeof schema.type === 'string') {
        expectedTypes = [schema.type];
    } else if (Array.isArray(schema.type)) {
        expectedTypes = schema.type;
    }

    // Check type of data
    const actualType = data === null ? 'null' : Array.isArray(data) ? 'array' : typeof data;
    
    let normalizedActual = actualType;
    if (actualType === 'number') {
        normalizedActual = 'number';
    } else if (actualType === 'boolean') {
        normalizedActual = 'boolean';
    } else if (actualType === 'object' && actualType !== 'null') {
        normalizedActual = 'object';
    }

    if (expectedTypes.length > 0) {
        let matched = false;
        for (const type of expectedTypes) {
            if (type === 'string' && normalizedActual === 'string') matched = true;
            else if (type === 'number' && (normalizedActual === 'number' || normalizedActual === 'integer')) matched = true;
            else if (type === 'boolean' && normalizedActual === 'boolean') matched = true;
            else if (type === 'object' && normalizedActual === 'object') matched = true;
            else if (type === 'array' && normalizedActual === 'array') matched = true;
            else if (type === 'null' && normalizedActual === 'null') matched = true;
        }
        if (!matched) {
            errors.push(`${path}: expected type [${expectedTypes.join(', ')}], got ${actualType}`);
            return errors;
        }
    }

    if (normalizedActual === 'object') {
        // Check required fields
        if (schema.required && Array.isArray(schema.required)) {
            for (const req of schema.required) {
                if (!(req in data) || data[req] === undefined) {
                    errors.push(`${path}: missing required property '${req}'`);
                }
            }
        }
        // Check properties
        if (schema.properties) {
            for (const key in data) {
                if (schema.properties[key]) {
                    const subErrors = validateDataAgainstSchema(data[key], schema.properties[key], `${path}.${key}`);
                    errors.push(...subErrors);
                } else if (schema.additionalProperties === false) {
                    errors.push(`${path}: additional property '${key}' is not allowed`);
                }
            }
        }
    } else if (normalizedActual === 'array') {
        if (schema.items) {
            for (let i = 0; i < data.length; i++) {
                const subErrors = validateDataAgainstSchema(data[i], schema.items, `${path}[${i}]`);
                errors.push(...subErrors);
            }
        }
    }

    return errors;
}

function convertToGeminiSchema(schema) {
    if (!schema || typeof schema !== 'object') return schema;

    const copy = { ...schema };

    // Remove unsupported properties
    delete copy.additionalProperties;

    // Convert array type to string type
    if (Array.isArray(copy.type)) {
        const mainType = copy.type.filter(t => t !== 'null')[0];
        copy.type = mainType || 'string';
    }

    // Process properties recursively
    if (copy.properties) {
        const newProperties = {};
        for (const key in copy.properties) {
            newProperties[key] = convertToGeminiSchema(copy.properties[key]);
        }
        copy.properties = newProperties;
    }

    // Process items recursively for array schemas
    if (copy.items) {
        copy.items = convertToGeminiSchema(copy.items);
    }

    return copy;
}

let genAIInstance = null;
function getGeminiClient() {
    if (!genAIInstance) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not configured in environment variables');
        }
        genAIInstance = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
    return genAIInstance;
}

async function extractBlueprintFromPrd(prdText) {
    const modelName = config.blueprintModel || 'gemini-2.5-flash';
    console.log(`[PRD] Blueprint provider: Gemini`);
    console.log(`[PRD] Blueprint model: ${modelName}`);
    console.log(`[Blueprint] model: ${modelName}`);
    console.log(`[Blueprint] PRD chars: ${prdText.length}`);
    console.log(`[Blueprint] JSON mode: enabled`);

    const genAI = getGeminiClient();
    const convertedSchema = convertToGeminiSchema(blueprintJsonSchema.schema);
    
    const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: convertedSchema
        }
    });

    const userContent = `${EXTRACTION_PROMPT}\n\nPRD CONTENT:\n---\n${prdText}\n---`;

    let rawOutput = '';
    let parsedJson = null;
    let validationErrors = [];
    let isSuccessful = false;

    // First attempt
    try {
        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: userContent }] }]
        });
        rawOutput = result.response.text();
        console.log(`[Blueprint] model response received`);
        
        // Try parsing
        try {
            parsedJson = JSON.parse(rawOutput);
        } catch (e) {
            const match = rawOutput.match(/\{[\s\S]*\}/);
            if (match) {
                parsedJson = JSON.parse(match[0]);
            } else {
                throw e;
            }
        }
        console.log(`[Blueprint] JSON parsed`);

        // Validate schema
        validationErrors = validateDataAgainstSchema(parsedJson, blueprintJsonSchema.schema, 'root');
        if (validationErrors.length === 0) {
            console.log(`[Blueprint] schema validation: PASS`);
            isSuccessful = true;
        } else {
            console.log(`[Blueprint] schema validation: FAIL`);
        }
    } catch (err) {
        console.log(`[Blueprint] JSON parsed (FAILED: ${err.message})`);
        console.log(`[Blueprint] schema validation: FAIL`);
        validationErrors = [`JSON Parsing / API Error: ${err.message}`];
    }

    // Repair attempt if needed
    if (!isSuccessful) {
        console.log(`[Blueprint] repair attempt: 1`);
        
        const repairHint = `Your previous JSON output failed validation with the following schema errors:\n${validationErrors.slice(0, 10).map(e => '- ' + e).join('\n')}\n\nPlease fix the JSON, ensure all required properties are populated, and do not invent any requirements. Return ONLY the complete corrected JSON.`;
        
        const repairPrompt = `${EXTRACTION_PROMPT}
        
${repairHint}

Previous incomplete JSON:
${rawOutput.substring(0, 3000)}`;

        try {
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: repairPrompt }] }]
            });
            const repairRawOutput = result.response.text();
            console.log(`[Blueprint] model response received`);

            try {
                parsedJson = JSON.parse(repairRawOutput);
            } catch (e) {
                const match = repairRawOutput.match(/\{[\s\S]*\}/);
                if (match) {
                    parsedJson = JSON.parse(match[0]);
                } else {
                    throw e;
                }
            }
            console.log(`[Blueprint] JSON parsed`);

            validationErrors = validateDataAgainstSchema(parsedJson, blueprintJsonSchema.schema, 'root');
            if (validationErrors.length === 0) {
                console.log(`[Blueprint] schema validation: PASS`);
                isSuccessful = true;
            } else {
                console.log(`[Blueprint] schema validation: FAIL`);
            }
        } catch (repairErr) {
            console.log(`[Blueprint] JSON parsed (FAILED: ${repairErr.message})`);
            console.log(`[Blueprint] schema validation: FAIL`);
            validationErrors.push(`Repair Parsing / API Error: ${repairErr.message}`);
        }
    }

    if (!isSuccessful) {
        console.error(`[Blueprint] Extraction failed. Final validation errors:`, validationErrors);
        throw new SafeAiError('AI_STRUCTURED_OUTPUT_INVALID', null, `AI Service Failed: validation failed. Errors: ${validationErrors.slice(0, 5).join('; ')}`);
    }

    // Normalize valid output into the existing Blueprint structure
    const { blueprint, errors } = validateAndNormalizeBlueprint(parsedJson);
    console.log(`[PRD] Blueprint extraction: success`);
    console.log(`[Blueprint] extraction completed`);

    return { blueprint, validationWarnings: errors };
}

function validateAndNormalizeBlueprint(raw) {
    const errors = [];
    const warnings = [];

    if (!raw || typeof raw !== 'object') {
        return { blueprint: null, errors: ['Blueprint is not an object'] };
    }

    const project = raw.project || {};
    const brief = raw.brief || {};

    const blueprint = {
        project: {
            name: isNonEmptyString(project.name) ? project.name.trim() : 'Untitled Project',
            summary: (project.summary || brief.overview || '').trim(),
            objective: (project.objective || brief.objective || '').trim(),
            problemStatement: (project.problemStatement || brief.problem || '').trim(),
            targetUsers: (project.targetUsers || brief.targetUsers || '').trim(),
            projectType: ['personal', 'freelance', 'company'].includes(project.projectType)
                ? project.projectType
                : 'personal',
            scope: (project.scope || brief.scope || '').trim(),
            constraints: (project.constraints || brief.constraints || '').trim()
        },
        requirements: [],
        techStack: [],
        phases: [],
        tasks: [],
        deliverables: [],
        risks: [],
        decisions: [],
        deadlines: [],
        brief: {
            overview: (brief.overview || project.summary || '').trim(),
            problem: (brief.problem || project.problemStatement || '').trim(),
            objective: (brief.objective || project.objective || '').trim(),
            targetUsers: (brief.targetUsers || project.targetUsers || '').trim(),
            coreFeatures: (brief.coreFeatures || '').trim(),
            requirements: (brief.requirements || '').trim(),
            scope: (brief.scope || project.scope || '').trim(),
            constraints: (brief.constraints || project.constraints || '').trim(),
            expectedDeliverables: (brief.expectedDeliverables || '').trim(),
            technology: (brief.technology || '').trim(),
            developmentDirection: (brief.developmentDirection || '').trim()
        },
        metadata: {
            extractedAt: new Date().toISOString(),
            version: 1
        }
    };

    const reqList = Array.isArray(raw.requirements) ? raw.requirements : [];
    blueprint.requirements = reqList.map((r, i) => ({
        id: isNonEmptyString(r.id) ? r.id.trim() : slugId('req', i),
        title: (r.title || '').trim(),
        description: (r.description || '').trim(),
        priority: normalizePriority(r.priority),
        category: (r.category || 'general').trim(),
        source: (r.source || 'PRD').trim()
    })).filter((r) => r.title || r.description);

    const techList = Array.isArray(raw.techStack) ? raw.techStack : [];
    const seenTech = new Set();
    blueprint.techStack = techList
        .map((t) => ({
            name: (t.name || t).toString().trim(),
            category: normalizeTechCategory(t.category),
            source: normalizeTechSource(t.source)
        }))
        .filter((t) => {
            const key = t.name.toLowerCase();
            if (!t.name || seenTech.has(key)) return false;
            seenTech.add(key);
            return true;
        });

    const phaseList = Array.isArray(raw.phases) ? raw.phases : [];
    blueprint.phases = phaseList.map((p, i) => ({
        id: isNonEmptyString(p.id) ? p.id.trim() : slugId('phase', i),
        name: (p.name || '').trim(),
        description: (p.description || '').trim(),
        order: typeof p.order === 'number' ? p.order : i + 1,
        objectives: Array.isArray(p.objectives) ? p.objectives.map(String) : [],
        dependencies: Array.isArray(p.dependencies) ? p.dependencies.map(String) : []
    })).filter((p) => p.name);

    const taskList = Array.isArray(raw.tasks) ? raw.tasks : [];
    const seenTasks = new Set();
    blueprint.tasks = taskList
        .map((t, i) => ({
            title: (t.title || '').trim(),
            description: (t.description || '').trim(),
            phase: (t.phase || '').trim(),
            phaseId: (t.phaseId || '').trim(),
            priority: normalizePriority(t.priority),
            dependencies: Array.isArray(t.dependencies) ? t.dependencies.map(String) : [],
            requirementIds: Array.isArray(t.requirementIds) ? t.requirementIds.map(String) : [],
            suggestedOrder: typeof t.suggestedOrder === 'number' ? t.suggestedOrder : i + 1,
            status: normalizeTaskStatus(t.status),
            source: (t.source || 'PRD').trim()
        }))
        .filter((t) => {
            if (!t.title) return false;
            const key = t.title.toLowerCase();
            if (seenTasks.has(key)) {
                warnings.push(`Duplicate task removed: ${t.title}`);
                return false;
            }
            seenTasks.add(key);
            return true;
        });

    blueprint.deliverables = (Array.isArray(raw.deliverables) ? raw.deliverables : [])
        .map((d) => ({
            name: (d.name || '').trim(),
            description: (d.description || '').trim(),
            relatedRequirements: Array.isArray(d.relatedRequirements) ? d.relatedRequirements.map(String) : [],
            milestone: (d.milestone || '').trim(),
            source: (d.source || 'PRD').trim()
        }))
        .filter((d) => d.name);

    blueprint.risks = (Array.isArray(raw.risks) ? raw.risks : [])
        .map((r) => ({
            title: (r.title || '').trim(),
            description: (r.description || '').trim(),
            severity: normalizePriority(r.severity, 'medium'),
            mitigation: (r.mitigation || '').trim(),
            source: (r.source || 'PRD').trim()
        }))
        .filter((r) => r.title);

    blueprint.decisions = (Array.isArray(raw.decisions) ? raw.decisions : [])
        .map((d) => ({
            title: (d.title || '').trim(),
            description: (d.description || d.reasoning || '').trim(),
            source: (d.source || 'PRD').trim()
        }))
        .filter((d) => d.title);

    blueprint.deadlines = (Array.isArray(raw.deadlines) ? raw.deadlines : [])
        .map((d) => ({
            title: (d.title || '').trim(),
            date: (d.date || '').trim(),
            description: (d.description || '').trim(),
            source: (d.source || 'PRD').trim(),
            confidence: ['explicit', 'needs_review', 'unresolved'].includes(d.confidence)
                ? d.confidence
                : 'needs_review'
        }))
        .filter((d) => d.title);

    if (blueprint.tasks.length === 0 && blueprint.phases.length > 0) {
        warnings.push('No tasks extracted — phases exist but tasks array is empty');
    }

    if (!blueprint.project.summary && !blueprint.project.objective) {
        errors.push('Project summary and objective are both empty');
    }

    return { blueprint, errors: [...errors, ...warnings] };
}

module.exports = {
    extractBlueprintFromPrd,
    validateAndNormalizeBlueprint,
    blueprintJsonSchema
};
