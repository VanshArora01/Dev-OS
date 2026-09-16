/**
 * ProjectBlueprint — intermediate structured representation between PRD and MongoDB.
 * Validated before persistence; never insert raw LLM output into the database.
 */

const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const TASK_STATUSES = ['todo', 'pending', 'in-progress', 'completed'];
const TECH_CATEGORIES = [
    'frontend', 'backend', 'database', 'authentication', 'apis',
    'infrastructure', 'ai_ml', 'deployment', 'testing', 'other'
];
const TECH_SOURCES = ['specified', 'recommended', 'inferred'];
const SEVERITIES = ['low', 'medium', 'high', 'critical'];
const DATE_CONFIDENCE = ['explicit', 'needs_review', 'unresolved'];

const BLUEPRINT_JSON_SCHEMA = {
    project: {
        name: 'string',
        summary: 'string',
        objective: 'string',
        problemStatement: 'string',
        targetUsers: 'string',
        projectType: 'personal | freelance | company',
        scope: 'string',
        constraints: 'string'
    },
    requirements: [{
        id: 'string',
        title: 'string',
        description: 'string',
        priority: 'low | medium | high | critical',
        category: 'string',
        source: 'string'
    }],
    techStack: [{
        name: 'string',
        category: 'frontend | backend | database | ...',
        source: 'specified | recommended | inferred'
    }],
    phases: [{
        id: 'string',
        name: 'string',
        description: 'string',
        order: 'number',
        objectives: ['string'],
        dependencies: ['string']
    }],
    tasks: [{
        title: 'string',
        description: 'string',
        phase: 'string',
        phaseId: 'string',
        priority: 'low | medium | high | critical',
        dependencies: ['string'],
        requirementIds: ['string'],
        suggestedOrder: 'number',
        status: 'todo',
        source: 'string'
    }],
    deliverables: [{
        name: 'string',
        description: 'string',
        relatedRequirements: ['string'],
        milestone: 'string',
        source: 'string'
    }],
    risks: [{
        title: 'string',
        description: 'string',
        severity: 'low | medium | high | critical',
        mitigation: 'string',
        source: 'string'
    }],
    decisions: [{
        title: 'string',
        description: 'string',
        source: 'string'
    }],
    deadlines: [{
        title: 'string',
        date: 'string (ISO or partial)',
        description: 'string',
        source: 'string',
        confidence: 'explicit | needs_review | unresolved'
    }],
    brief: {
        overview: 'string',
        problem: 'string',
        objective: 'string',
        targetUsers: 'string',
        coreFeatures: 'string',
        requirements: 'string',
        scope: 'string',
        constraints: 'string',
        expectedDeliverables: 'string',
        technology: 'string',
        developmentDirection: 'string'
    }
};

const INITIALIZATION_STAGES = [
    'creating_project',
    'reading_prd',
    'understanding_requirements',
    'building_project_plan',
    'creating_milestones',
    'creating_tasks',
    'extracting_tech_stack',
    'extracting_deadlines',
    'building_project_brief',
    'prd_indexing',
    'updating_ai_context',
    'complete',
    'failed'
];

function isNonEmptyString(v) {
    return typeof v === 'string' && v.trim().length > 0;
}

function normalizePriority(v, fallback = 'medium') {
    const lower = (v || '').toLowerCase();
    return PRIORITIES.includes(lower) ? lower : fallback;
}

function normalizeTaskStatus(v) {
    const lower = (v || 'todo').toLowerCase().replace('_', '-');
    if (lower === 'todo') return 'pending';
    if (TASK_STATUSES.includes(lower)) return lower === 'todo' ? 'pending' : lower;
    return 'pending';
}

function normalizeTechCategory(v) {
    const lower = (v || 'other').toLowerCase().replace(/[\s-]/g, '_');
    if (lower === 'ai' || lower === 'ml' || lower === 'ai/ml') return 'ai_ml';
    return TECH_CATEGORIES.includes(lower) ? lower : 'other';
}

function normalizeTechSource(v) {
    const lower = (v || 'specified').toLowerCase();
    return TECH_SOURCES.includes(lower) ? lower : 'specified';
}

function slugId(prefix, index) {
    return `${prefix}-${index + 1}`;
}

module.exports = {
    PRIORITIES,
    TASK_STATUSES,
    TECH_CATEGORIES,
    TECH_SOURCES,
    SEVERITIES,
    DATE_CONFIDENCE,
    INITIALIZATION_STAGES,
    BLUEPRINT_JSON_SCHEMA,
    isNonEmptyString,
    normalizePriority,
    normalizeTaskStatus,
    normalizeTechCategory,
    normalizeTechSource,
    slugId
};
