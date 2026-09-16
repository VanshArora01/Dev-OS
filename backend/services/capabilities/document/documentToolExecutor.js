const { generateDocx, generatePdf } = require('./documentGenerationService');
const { classifyArtifactType } = require('./artifactClassifier');
const { extractProjectContext } = require('./projectContextExtractor');
const { buildArtifact } = require('./artifactBuilders');
const { ARTIFACT_TYPES, normalizeArtifactType } = require('./artifactTypes');
const { parseSimpleContent } = require('./simpleDocumentParser');

function normalizeToolError(error, code = 'DOCUMENT_TOOL_ERROR') {
    if (typeof error === 'object' && error?.code) {
        return { success: false, error };
    }
    const message = typeof error === 'string' ? error : error?.message || 'Document tool failed';
    return {
        success: false,
        error: {
            code,
            message,
            retryable: true
        }
    };
}

function resolveDocumentInput(toolArgs, context) {
    const docContext = {
        userId: context.userId,
        projectId: context.projectId,
        projectName: context.project?.name,
        author: context.project?.owner?.name || 'DevOS User',
        organization: context.project?.name || 'DevOS Project'
    };

    if (toolArgs.document || toolArgs.artifact) {
        return toolArgs.document || toolArgs.artifact;
    }

    const classifyText = [
        toolArgs.title,
        toolArgs.content,
        context.lastUserMessage
    ].filter(Boolean).join(' ');

    const artifactType = normalizeArtifactType(toolArgs.artifact_type) ||
        classifyArtifactType(classifyText, { artifact_type: toolArgs.artifact_type });

    const projectCtx = extractProjectContext(context.project || {}, {
        recentSessions: context.recentSessions || [],
        lastSessionSummary: context.project?.lastSessionSummary
    });

  // Structured artifact from project data (preferred path)
    if (artifactType && artifactType !== ARTIFACT_TYPES.GENERIC) {
        return buildArtifact(artifactType, projectCtx, {
            title: toolArgs.title,
            content: toolArgs.content,
            subtitle: toolArgs.subtitle
        });
    }

    if (toolArgs.content) {
        return buildArtifact(ARTIFACT_TYPES.GENERIC, projectCtx, {
            title: toolArgs.title,
            content: toolArgs.content
        });
    }

    if (artifactType === ARTIFACT_TYPES.GENERIC && toolArgs.title) {
        return buildArtifact(ARTIFACT_TYPES.GENERIC, projectCtx, { title: toolArgs.title });
    }

    return null;
}

async function executeDocumentTool(toolName, toolArgs, context) {
    const { userId, projectId, project } = context;

    const docContext = {
        userId,
        projectId,
        projectName: project?.name,
        author: project?.owner?.name || 'DevOS User',
        organization: project?.name || 'DevOS Project'
    };

    const rawDocument = resolveDocumentInput(toolArgs, context);
    if (!rawDocument) {
        return normalizeToolError(
            'Provide artifact_type (e.g. tech_stack, project_report) and output_name. Optional: title, content for generic documents.',
            'INVALID_DOCUMENT'
        );
    }

    const outputName = toolArgs.output_name;

    try {
        switch (toolName) {
            case 'generate_docx':
                return await generateDocx(rawDocument, outputName, docContext);

            case 'generate_pdf':
                return await generatePdf(rawDocument, outputName, docContext);

            default:
                return normalizeToolError(`Unknown document tool: ${toolName}`, 'UNKNOWN_TOOL');
        }
    } catch (error) {
        console.error(`[Tool] ${toolName} failed:`, error.message);
        return normalizeToolError(error);
    }
}

module.exports = { executeDocumentTool, resolveDocumentInput };
