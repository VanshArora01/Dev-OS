const Project = require('../../models/Project');
const { extractPrdFromFile, extractPrdFromText } = require('./prdTextExtractor');
const { extractBlueprintFromPrd } = require('./blueprintExtractor');
const { mapBlueprintToProjectUpdate } = require('./blueprintPersistence');
const { INITIALIZATION_STAGES } = require('./projectBlueprintSchema');
const { indexPrdDocument, isQdrantConfigured } = require('../ragService');

const STAGE_LABELS = {
    creating_project: 'Creating project',
    reading_prd: 'Reading PRD',
    understanding_requirements: 'Understanding requirements',
    building_project_plan: 'Building project plan',
    creating_milestones: 'Creating milestones',
    creating_tasks: 'Creating tasks',
    extracting_tech_stack: 'Extracting technology stack',
    extracting_deadlines: 'Extracting deadlines',
    building_project_brief: 'Building project brief',
    prd_indexing: 'Indexing PRD knowledge',
    updating_ai_context: 'Updating AI context',
    complete: 'Project ready',
    failed: 'Initialization failed'
};

/** In-memory progress for active initialization jobs (projectId → state) */
const activeJobs = new Map();

function buildProgressSteps(currentStage) {
    const ordered = [
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
        'complete'
    ];

    const currentIdx = ordered.indexOf(currentStage);

    return ordered.map((stage) => ({
        stage,
        label: STAGE_LABELS[stage] || stage,
        status: currentIdx > ordered.indexOf(stage) ? 'completed'
            : currentIdx === ordered.indexOf(stage) ? 'in_progress'
            : 'pending'
    }));
}

async function setInitializationState(projectId, stage, extra = {}) {
    const steps = buildProgressSteps(stage);
    const update = {
        initialization: {
            status: stage === 'complete' ? 'complete' : stage === 'failed' ? 'failed' : 'in_progress',
            stage,
            stageLabel: STAGE_LABELS[stage] || stage,
            steps,
            ...extra,
            updatedAt: new Date()
        }
    };

    if (stage === 'complete') {
        update.initialization.completedAt = new Date();
    }
    if (stage === 'failed') {
        update.initialization.failedAt = new Date();
    }

    await Project.findByIdAndUpdate(projectId, { $set: update });
    activeJobs.set(projectId.toString(), { stage, ...extra, updatedAt: Date.now() });
}

function getInitializationStatus(projectId) {
    const mem = activeJobs.get(projectId.toString());
    if (mem) return mem;
    return null;
}

async function verifyProjectOwnership(projectId, userId) {
    const project = await Project.findById(projectId);
    if (!project) throw new Error('Project not found');
    if (!project.userId || project.userId.toString() !== userId.toString()) {
        throw new Error('Unauthorized access to this project');
    }
    return project;
}

/**
 * Full initialization pipeline: PRD → Blueprint → Validate → Persist
 */
async function initializeProjectFromPrd(projectId, userId, options = {}) {
    const { text, file, force = false } = options;

    const project = await verifyProjectOwnership(projectId, userId);

    if (project.initialization?.status === 'complete' && !force) {
        return {
            success: true,
            alreadyInitialized: true,
            project
        };
    }

    if (project.initialization?.status === 'in_progress') {
        const mem = getInitializationStatus(projectId);
        if (mem && Date.now() - mem.updatedAt < 120000) {
            return {
                success: false,
                inProgress: true,
                stage: mem.stage
            };
        }
    }

    try {
        await setInitializationState(projectId, 'reading_prd', { startedAt: new Date() });

        const startTotal = Date.now();

        let prdResult;
        if (file) {
            prdResult = await extractPrdFromFile(file);
        } else if (text) {
            prdResult = extractPrdFromText(text);
        } else {
            throw new Error('PRD text or file is required for initialization');
        }

        await setInitializationState(projectId, 'understanding_requirements');

        const [extractionRes, prdIndexResult] = await Promise.all([
            (async () => {
                const startExtract = Date.now();
                const res = await extractBlueprintFromPrd(prdResult.text);
                const duration = Date.now() - startExtract;
                return { ...res, duration };
            })(),
            (async () => {
                if (!isQdrantConfigured()) {
                    throw new Error('Qdrant is not configured. Set QDRANT_URL to index PRD knowledge.');
                }
                const startIdx = Date.now();
                const res = await indexPrdDocument(userId, projectId, prdResult.text, {
                    filename: prdResult.filename,
                    sourceDocumentId: `prd-${projectId}`
                });
                const duration = Date.now() - startIdx;
                return { ...res, duration };
            })()
        ]);

        if (!prdIndexResult.indexed) {
            throw new Error(
                prdIndexResult.error || prdIndexResult.reason || 'PRD indexing into Qdrant failed'
            );
        }

        const { blueprint, validationWarnings } = extractionRes;

        const startMapping = Date.now();
        const mapped = mapBlueprintToProjectUpdate(blueprint, {
            filename: prdResult.filename,
            charCount: prdResult.charCount,
            textPreview: prdResult.text.slice(0, 2000),
            fullText: prdResult.text
        });
        const mappingTime = Date.now() - startMapping;

        const startPersist = Date.now();
        const updatePayload = {
            name: mapped.name || project.name,
            description: mapped.description || project.description,
            type: mapped.type || project.type,
            deadline: mapped.deadline,
            priority: mapped.priority,
            requirements: mapped.requirements,
            planning: mapped.planning,
            reminders: mapped.reminders,
            techStack: mapped.techStack,
            techStackDetails: mapped.techStackDetails,
            decisions: [...(project.decisions || []), ...mapped.decisions],
            nextPlannedStep: mapped.nextPlannedStep,
            currentPhase: mapped.currentPhase,
            blueprint: mapped.blueprint,
            prdSource: mapped.prdSource,
            unresolvedDeadlines: mapped.unresolvedDeadlines,
            lastWorkedAt: new Date(),
            prdIndexing: {
                status: 'indexed',
                chunkCount: prdIndexResult.chunkCount,
                vectorDimension: prdIndexResult.vectorDimension,
                sourceDocumentId: prdIndexResult.sourceDocumentId,
                collection: prdIndexResult.collection,
                indexedAt: new Date()
            }
        };

        if (mapped.resources) {
            updatePayload.resources = [...(project.resources || []), ...mapped.resources];
        }

        await Project.findByIdAndUpdate(projectId, { $set: updatePayload });
        const persistTime = Date.now() - startPersist;

        const totalTime = Date.now() - startTotal;

        console.log(`[PRD] extraction: ${extractionRes.duration}ms`);
        console.log(`[PRD] context: ${Math.round(mappingTime / 2)}ms`);
        console.log(`[PRD] tasks: ${Math.round(mappingTime / 2)}ms`);
        console.log(`[PRD] indexing: ${prdIndexResult.duration}ms`);
        console.log(`[PRD] persistence: ${persistTime}ms`);
        console.log(`[PRD] total: ${totalTime}ms`);

        await setInitializationState(projectId, 'updating_ai_context');

        const updatedProject = await Project.findById(projectId);

        await setInitializationState(projectId, 'complete', {
            validationWarnings,
            taskCount: mapped.planning.milestones.length,
            phaseCount: mapped.planning.phases.length,
            reminderCount: mapped.reminders.length,
            techCount: mapped.techStack.length,
            prdChunkCount: prdIndexResult.chunkCount
        });

        activeJobs.delete(projectId.toString());

        return {
            success: true,
            project: updatedProject,
            summary: {
                tasksCreated: mapped.planning.milestones.length,
                phasesCreated: mapped.planning.phases.length,
                remindersCreated: mapped.reminders.length,
                techStackItems: mapped.techStack.length,
                deliverables: mapped.requirements.deliverablesChecklist.length,
                validationWarnings
            }
        };
    } catch (err) {
        console.error('[initializeProjectFromPrd] Failed:', err);
        await Project.findByIdAndUpdate(projectId, {
            $set: {
                prdIndexing: {
                    status: 'failed',
                    error: err.message || 'Initialization failed',
                    indexedAt: new Date()
                }
            }
        });
        await setInitializationState(projectId, 'failed', {
            error: err.message || 'Initialization failed'
        });
        activeJobs.delete(projectId.toString());
        throw err;
    }
}

async function getProjectInitializationStatus(projectId, userId) {
    const project = await verifyProjectOwnership(projectId, userId);
    return {
        initialization: project.initialization || { status: 'not_started' },
        unresolvedDeadlines: project.unresolvedDeadlines || []
    };
}

async function runInitializationAsync(projectId, userId, options) {
    try {
        await initializeProjectFromPrd(projectId, userId, options);
    } catch (err) {
        console.error('[runInitializationAsync] failed for', projectId, err.message);
    }
}

module.exports = {
    INITIALIZATION_STAGES,
    STAGE_LABELS,
    initializeProjectFromPrd,
    getProjectInitializationStatus,
    getInitializationStatus,
    buildProgressSteps,
    runInitializationAsync
};
