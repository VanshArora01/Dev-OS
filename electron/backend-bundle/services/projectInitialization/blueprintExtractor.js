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


const EXTRACTION_PROMPT = `You are a senior software project architect. Analyze the COMPLETE PRD and produce a STRICT structured project blueprint.

CRITICAL RULES — VIOLATIONS ARE UNACCEPTABLE:
1. DO NOT invent requirements, technologies, deadlines, or milestones not reasonably supported by the PRD.
2. If something is not in the PRD, mark it as "not specified" in text fields or omit it.
3. For technologies: only include what is EXPLICITLY mentioned. Use source "specified". Use "recommended" ONLY for clearly implied essentials with no alternative stated. Use "inferred" rarely.
4. For deadlines: ONLY include dates EXPLICITLY stated in the PRD. If year is missing, set confidence to "needs_review". Never invent years.
5. For relative dates ("within 2 weeks", "next Friday"): set confidence to "needs_review" — do NOT convert to calendar dates.
6. All tasks must have status "todo" — never mark work as completed.
7. Generate tasks following a LOGICAL software development lifecycle adapted to THIS project (not generic boilerplate).
8. Derive actual tasks from PRD features — do NOT create generic "setup backend, create database, build frontend" unless the PRD warrants it.
9. Every requirement, deadline, task, tech item, risk, and decision MUST include a "source" field citing the PRD section (e.g. "PRD → Authentication Requirements").
10. Phases represent development lifecycle stages (Requirements, Architecture, Backend, Frontend, Testing, Deployment, etc.) adapted to the project type.

Return ONLY valid JSON matching this exact structure:
{
  "project": {
    "name": "string",
    "summary": "string",
    "objective": "string",
    "problemStatement": "string",
    "targetUsers": "string",
    "projectType": "personal | freelance | company",
    "scope": "string",
    "constraints": "string"
  },
  "requirements": [{ "id": "req-1", "title": "", "description": "", "priority": "medium", "category": "", "source": "" }],
  "techStack": [{ "name": "", "category": "frontend|backend|database|authentication|apis|infrastructure|ai_ml|deployment|testing|other", "source": "specified|recommended|inferred" }],
  "phases": [{ "id": "phase-1", "name": "", "description": "", "order": 1, "objectives": [], "dependencies": [] }],
  "tasks": [{ "title": "", "description": "", "phase": "", "phaseId": "phase-1", "priority": "medium", "dependencies": [], "requirementIds": [], "suggestedOrder": 1, "status": "todo", "source": "" }],
  "deliverables": [{ "name": "", "description": "", "relatedRequirements": [], "milestone": "", "source": "" }],
  "risks": [{ "title": "", "description": "", "severity": "medium", "mitigation": "", "source": "" }],
  "decisions": [{ "title": "", "description": "", "source": "" }],
  "deadlines": [{ "title": "", "date": "ISO date or partial", "description": "", "source": "", "confidence": "explicit|needs_review|unresolved" }],
  "brief": {
    "overview": "", "problem": "", "objective": "", "targetUsers": "",
    "coreFeatures": "", "requirements": "", "scope": "", "constraints": "",
    "expectedDeliverables": "", "technology": "", "developmentDirection": ""
  }
}`;

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

async function callGroqForBlueprint(prdText, retryHint = '') {
    const userContent = `${EXTRACTION_PROMPT}

${retryHint ? `REPAIR HINT: ${retryHint}\n` : ''}
PRD CONTENT:
---
${prdText}
---`;

    const completion = await safeGroqCompletion({
        model: config.blueprintModel,
        messages: [
            {
                role: 'system',
                content: 'You extract structured project blueprints from PRDs. Return only valid JSON. Never hallucinate requirements or dates.'
            },
            { role: 'user', content: userContent }
        ],
        response_format: { type: 'json_schema', json_schema: blueprintJsonSchema },
        temperature: 0.2
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error('Empty response from AI model');

    try {
        return JSON.parse(raw);
    } catch {
        const match = raw.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]);
        throw new Error('AI returned invalid JSON');
    }
}

async function extractBlueprintFromPrd(prdText) {
    if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY not configured on server');
    }

    let lastError;
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const raw = await callGroqForBlueprint(
                prdText,
                attempt > 0 ? lastError?.message || 'Fix validation errors' : ''
            );
            const { blueprint, errors } = validateAndNormalizeBlueprint(raw);
            if (errors.length > 0 && attempt < 1) {
                lastError = new Error(errors.join('; '));
                continue;
            }
            return { blueprint, validationWarnings: errors };
        } catch (err) {
            lastError = err;
            if (err.message === 'AI returned invalid JSON' || err.message === 'Empty response from AI model') {
                if (attempt === 1) throw err;
                continue;
            }
            throw err;
        }
    }
    throw lastError || new Error('Blueprint extraction failed');
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
    validateAndNormalizeBlueprint
};
