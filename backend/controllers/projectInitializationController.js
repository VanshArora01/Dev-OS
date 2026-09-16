const {
    initializeProjectFromPrd,
    getProjectInitializationStatus,
    getInitializationStatus,
    runInitializationAsync
} = require('../services/projectInitialization/initializationService');
const { extractPrdFromFile, extractPrdFromText } = require('../services/projectInitialization/prdTextExtractor');
const { indexPrdDocument, isQdrantConfigured } = require('../services/ragService');
const Project = require('../models/Project');
const User = require('../models/User');

async function getUserIdFromClerkId(clerkId) {
    if (!clerkId) return null;
    const user = await User.findOne({ clerkId });
    return user?._id;
}

/**
 * POST /api/projects/:id/initialize
 * Body: { clerkId, text } OR multipart file field "prd"
 * Returns immediately; poll GET /initialization-status for progress.
 */
exports.initializeProject = async (req, res) => {
    try {
        const { userId, clerkId } = req.auth;
        const text = req.body?.text;
        const force = req.body?.force;
        const projectId = req.params.id;

        if (!clerkId) {
            return res.status(400).json({ success: false, error: 'Clerk ID is required' });
        }

        // const userId = await getUserIdFromClerkId(clerkId); // Retrieved from req.auth
        if (!userId) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const options = { force: force === true || force === 'true' };

        if (req.file) {
            options.file = req.file;
        } else if (text) {
            options.text = text;
        } else {
            return res.status(400).json({
                success: false,
                error: 'PRD text or file is required. Upload a document or paste PRD content.'
            });
        }

        // Check if already in progress
        const existing = await getProjectInitializationStatus(projectId, userId);
        if (existing.initialization?.status === 'in_progress') {
            const mem = getInitializationStatus(projectId);
            if (mem && Date.now() - mem.updatedAt < 180000) {
                return res.status(202).json({
                    success: true,
                    started: true,
                    inProgress: true,
                    stage: existing.initialization.stage
                });
            }
        }

        if (existing.initialization?.status === 'complete' && !options.force) {
            return res.json({
                success: true,
                alreadyInitialized: true,
                initialization: existing.initialization
            });
        }

        // Mark in-progress immediately before spawning async work
        const Project = require('../models/Project');
        await Project.findOneAndUpdate(
            { _id: projectId, userId },
            {
            $set: {
                initialization: {
                    status: 'in_progress',
                    stage: 'reading_prd',
                    stageLabel: 'Reading PRD',
                    startedAt: new Date(),
                    updatedAt: new Date()
                }
            }
        });

        // Start async initialization — do not await
        runInitializationAsync(projectId, userId, options).catch((err) => {
            console.error('[runInitializationAsync]', err);
        });

        res.status(202).json({
            success: true,
            started: true,
            message: 'Initialization started. Poll initialization-status for progress.'
        });
    } catch (err) {
        console.error('[initializeProject]', err);
        res.status(500).json({
            success: false,
            error: err.message || 'Project initialization failed'
        });
    }
};

/**
 * GET /api/projects/:id/initialization-status
 */
exports.getInitializationStatus = async (req, res) => {
    try {
        const { userId, clerkId } = req.auth;
        const projectId = req.params.id;

        if (!clerkId) {
            return res.status(400).json({ error: 'Clerk ID is required' });
        }

        // const userId = await getUserIdFromClerkId(clerkId); // Retrieved from req.auth
        if (!userId) {
            return res.status(404).json({ error: 'User not found' });
        }

        const status = await getProjectInitializationStatus(projectId, userId);
        res.json(status);
    } catch (err) {
        console.error('[getInitializationStatus]', err);
        res.status(err.message.includes('Unauthorized') ? 403 : 500).json({
            error: err.message
        });
    }
};

/**
 * POST /api/projects/parse-prd — extraction only (no AI synthesis)
 */
exports.extractPRDText = async (req, res) => {
    try {
        if (req.file) {
            const result = await extractPrdFromFile(req.file);
            return res.json({
                success: true,
                text: result.text,
                filename: result.filename,
                charCount: result.charCount
            });
        }

        if (req.body?.text) {
            const result = extractPrdFromText(req.body.text);
            return res.json({
                success: true,
                text: result.text,
                filename: result.filename,
                charCount: result.charCount
            });
        }

        return res.status(400).json({ success: false, error: 'File or text required' });
    } catch (err) {
        console.error('[extractPRDText]', err);
        res.status(422).json({ success: false, error: err.message });
    }
};

/**
 * POST /api/projects/:id/reindex-prd
 * Retry PRD indexing into Qdrant from stored prdSource.fullText
 */
exports.reindexPrd = async (req, res) => {
    try {
        const { userId, clerkId } = req.auth;
        const projectId = req.params.id;

        if (!clerkId) {
            return res.status(400).json({ success: false, error: 'Clerk ID is required' });
        }

        // const userId = await getUserIdFromClerkId(clerkId); // Retrieved from req.auth
        if (!userId) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        const project = await Project.findOne({ _id: projectId, userId });
        if (!project) {
            return res.status(404).json({ success: false, error: 'Project not found' });
        }

        const prdText = project.prdSource?.fullText;
        if (!prdText || prdText.trim().length < 50) {
            return res.status(400).json({
                success: false,
                error: 'No stored PRD text available for reindexing.'
            });
        }

        if (!isQdrantConfigured()) {
            return res.status(500).json({
                success: false,
                error: 'Qdrant is not configured. Set QDRANT_URL.'
            });
        }

        const result = await indexPrdDocument(userId, projectId, prdText, {
            filename: project.prdSource?.filename || 'prd',
            sourceDocumentId: `prd-${projectId}`
        });

        if (!result.indexed) {
            return res.status(500).json({
                success: false,
                error: result.error || result.reason || 'PRD reindexing failed'
            });
        }

        await Project.findOneAndUpdate(
            { _id: projectId, userId },
            {
            $set: {
                prdIndexing: {
                    status: 'indexed',
                    chunkCount: result.chunkCount,
                    vectorDimension: result.vectorDimension,
                    sourceDocumentId: result.sourceDocumentId,
                    collection: result.collection,
                    indexedAt: new Date()
                }
            }
        });

        res.json({
            success: true,
            chunkCount: result.chunkCount,
            vectorDimension: result.vectorDimension,
            collection: result.collection
        });
    } catch (err) {
        console.error('[reindexPrd]', err);
        res.status(500).json({ success: false, error: err.message });
    }
};
