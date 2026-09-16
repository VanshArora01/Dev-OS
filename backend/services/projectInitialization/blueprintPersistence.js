const { parseDeadlineDate, resolveProjectDeadline } = require('./deadlineParser');

/**
 * Map validated ProjectBlueprint → existing Project MongoDB fields.
 * Does not duplicate data — uses embedded subdocuments on Project.
 */

function formatBriefSection(label, content) {
    if (!content || !content.trim()) return '';
    return `${label}:\n${content.trim()}`;
}

function buildClientRequirements(brief, project) {
    const sections = [
        formatBriefSection('Project Overview', brief.overview || project.summary),
        formatBriefSection('Problem', brief.problem || project.problemStatement),
        formatBriefSection('Objective', brief.objective || project.objective),
        formatBriefSection('Target Users', brief.targetUsers || project.targetUsers),
        formatBriefSection('Core Features', brief.coreFeatures),
        formatBriefSection('Scope', brief.scope || project.scope),
        formatBriefSection('Expected Deliverables', brief.expectedDeliverables)
    ].filter(Boolean);

    return sections.join('\n\n');
}

function buildTechnicalRequirements(brief, blueprint) {
    const sections = [
        formatBriefSection('Technology', brief.technology),
        formatBriefSection('Development Direction', brief.developmentDirection),
        formatBriefSection('Requirements Summary', brief.requirements)
    ].filter(Boolean);

    if (blueprint.requirements.length > 0) {
        const reqList = blueprint.requirements
            .slice(0, 30)
            .map((r) => `- [${r.priority}] ${r.title}: ${r.description} (Source: ${r.source})`)
            .join('\n');
        sections.push(`Extracted Requirements:\n${reqList}`);
    }

    return sections.join('\n\n');
}

function buildConstraintsText(brief, project, blueprint) {
    const sections = [
        formatBriefSection('Constraints', brief.constraints || project.constraints)
    ].filter(Boolean);

    if (blueprint.risks.length > 0) {
        const risks = blueprint.risks
            .map((r) => `- [${r.severity}] ${r.title}: ${r.description} (Source: ${r.source})`)
            .join('\n');
        sections.push(`Identified Risks:\n${risks}`);
    }

    return sections.join('\n\n');
}

/** Maximum number of tasks created during PRD initialization (enforced at persistence layer). */
const MAX_INITIAL_TASKS = 10;

function mapBlueprintToProjectUpdate(blueprint, prdMeta = {}) {
    const { project: proj, brief } = blueprint;
    const crypto = require('crypto');
    const fullText = prdMeta.fullText || '';

    const sortedTasks = [...blueprint.tasks]
        .sort((a, b) => (a.suggestedOrder || 0) - (b.suggestedOrder || 0))
        .slice(0, MAX_INITIAL_TASKS); // Hard cap — never persist more than MAX_INITIAL_TASKS

    const milestones = sortedTasks.map((task) => ({
        title: task.title,
        description: task.description || '',
        status: task.status === 'in-progress' ? 'in-progress' : task.status === 'completed' ? 'completed' : 'pending',
        phase: task.phase || '',
        phaseId: task.phaseId || '',
        priority: task.priority || 'medium',
        dependencies: task.dependencies || [],
        requirementIds: task.requirementIds || [],
        source: task.source || 'PRD',
        order: task.suggestedOrder || 0
    }));

    const phases = blueprint.phases.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        order: p.order,
        objectives: p.objectives || [],
        dependencies: p.dependencies || []
    }));

    const deliverablesChecklist = blueprint.deliverables.map((d) => ({
        item: d.name,
        done: false,
        description: d.description || '',
        source: d.source || 'PRD'
    }));

    // Fallback: use deliverables from brief if none extracted
    if (deliverablesChecklist.length === 0 && brief.expectedDeliverables) {
        brief.expectedDeliverables.split('\n').filter((l) => l.trim()).forEach((line) => {
            deliverablesChecklist.push({ item: line.replace(/^[-*]\s*/, '').trim(), done: false, source: 'PRD' });
        });
    }

    const techStackDetails = blueprint.techStack.map((t) => ({
        name: t.name,
        category: t.category,
        source: t.source
    }));

    const techStack = techStackDetails.map((t) => t.name);

    const reminders = [];
    const unresolvedDeadlines = [];

    for (const dl of blueprint.deadlines) {
        const parsed = parseDeadlineDate(dl.date, dl.confidence);
        if (parsed && dl.confidence === 'explicit') {
            reminders.push({
                date: parsed,
                message: `${dl.title}${dl.description ? ': ' + dl.description : ''} [Source: ${dl.source}]`,
                sent: false,
                source: dl.source || 'PRD',
                confidence: dl.confidence
            });
        } else {
            unresolvedDeadlines.push({
                title: dl.title,
                date: dl.date,
                description: dl.description,
                source: dl.source,
                confidence: dl.confidence || 'needs_review'
            });
        }
    }

    const projectDeadline = resolveProjectDeadline(blueprint.deadlines);

    const decisions = blueprint.decisions.map((d) => ({
        title: d.title,
        reasoning: `${d.description}\n\nSource: ${d.source}`,
        date: new Date(),
        tag: 'PRD'
    }));

    const nextPlannedStep = sortedTasks.find((t) => t.status === 'pending' || t.status === 'todo')
        ? sortedTasks.find((t) => t.status === 'pending' || t.status === 'todo').title
        : phases[0]?.name || 'Review project plan';

    const currentPhase = phases[0]?.name || sortedTasks[0]?.phase || '';

    const prdResource = prdMeta.filename
        ? [{ label: 'Original PRD', url: `prd://${prdMeta.filename}` }]
        : [];

    return {
        name: proj.name,
        description: proj.summary || brief.overview || '',
        type: proj.projectType || 'personal',
        deadline: projectDeadline,
        priority: inferProjectPriority(blueprint),
        requirements: {
            clientRequirements: buildClientRequirements(brief, proj),
            technicalRequirements: buildTechnicalRequirements(brief, blueprint),
            constraints: buildConstraintsText(brief, proj, blueprint),
            deliverablesChecklist
        },
        planning: {
            phases,
            milestones
        },
        reminders,
        techStack,
        techStackDetails,
        decisions,
        nextPlannedStep,
        currentPhase,
        blueprint,
        prdSource: {
            filename: prdMeta.filename || 'pasted-text',
            charCount: prdMeta.charCount || 0,
            extractedAt: new Date(),
            preview: (prdMeta.textPreview || fullText).slice(0, 2000),
            fullText: fullText || undefined,
            contentHash: fullText
                ? crypto.createHash('sha256').update(fullText).digest('hex')
                : undefined
        },
        unresolvedDeadlines,
        resources: prdResource.length > 0 ? prdResource : undefined
    };
}

function inferProjectPriority(blueprint) {
    const reqs = blueprint.requirements || [];
    if (reqs.some((r) => r.priority === 'critical')) return 'critical';
    if (reqs.some((r) => r.priority === 'high')) return 'high';
    return 'medium';
}

module.exports = {
    mapBlueprintToProjectUpdate,
    buildClientRequirements,
    buildTechnicalRequirements,
    buildConstraintsText
};
