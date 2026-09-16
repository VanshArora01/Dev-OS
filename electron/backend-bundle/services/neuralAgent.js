const PendingAIAction = require('../models/PendingAIAction');
const { safeGroqCompletion } = require('./groqClient');
const { isWriteTool, buildApprovalDescription } = require('./driveToolDefinitions');
const { executeDriveTool } = require('./driveToolExecutor');
const { executeGithubTool } = require('./githubToolExecutor');
const { executeLegacyTool } = require('./legacyToolExecutor');
const { executeDocumentTool } = require('./capabilities/document/documentToolExecutor');
const { executeEmailTool } = require('./capabilities/document/emailToolExecutor');
const { EventEmitter } = require('events');
const { config } = require('../config/ai');
const { validateArtifactForUpload, isValidArtifactIdFormat } = require('./capabilities/document/artifactValidation');
const googleDriveConnector = require('./googleDriveConnector');
const {
    recoverToolCallFromError,
    isGroqToolUseFailedError,
    isInvalidToolInRequestError
} = require('./groqToolRecovery');
const {
    getToolNamesFromDefinitions,
    normalizeToolName,
    buildUnavailableToolError,
    GENERATION_TOOLS
} = require('./toolCatalog');

const MAX_AGENT_ITERATIONS = 5;
const HITL_TTL_MS = 15 * 60 * 1000;

function createGenerationState() {
    return {
        docx: null,
        pdf: null
    };
}

function cleanMessages(msgs, allowedToolNames = []) {
    return msgs.map((msg) => {
        if (msg.role === 'tool') {
            return {
                role: 'tool',
                tool_call_id: msg.tool_call_id,
                content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
            };
        }
        if (msg.role === 'assistant') {
            const clean = {
                role: 'assistant',
                content: msg.content || ''
            };
            if (msg.tool_calls?.length > 0) {
                const validToolCalls = msg.tool_calls.filter(tc => allowedToolNames.includes(tc.function.name));
                if (validToolCalls.length > 0) {
                    clean.tool_calls = validToolCalls.map((tc) => ({
                        id: tc.id,
                        type: tc.type,
                        function: {
                            name: tc.function.name,
                            arguments: tc.function.arguments
                        }
                    }));
                }
            }
            return clean;
        }
        return { role: msg.role, content: msg.content || '' };
    });
}

function collectSources(toolResult, sources) {
    if (toolResult?.source) {
        sources.push(toolResult.source);
    }
    if (toolResult?.sources?.length) {
        sources.push(...toolResult.sources);
    }
    if (toolResult?.file?.name) {
        sources.push({
            title: toolResult.file.name,
            url: toolResult.file.webViewLink,
            fileId: toolResult.file.id
        });
    }
    if (toolResult?.files?.length) {
        toolResult.files.slice(0, 5).forEach((file) => {
            sources.push({
                title: file.name,
                url: file.webViewLink,
                fileId: file.id
            });
        });
    }
    if (toolResult?.commit?.htmlUrl) {
        sources.push({
            title: `GitHub → commit ${String(toolResult.commit.sha || '').slice(0, 7)}`,
            url: toolResult.commit.htmlUrl
        });
    }
    if (toolResult?.pullRequest?.htmlUrl) {
        sources.push({
            title: `GitHub → PR #${toolResult.pullRequest.number}`,
            url: toolResult.pullRequest.htmlUrl
        });
    }
}

function dedupeSources(sources) {
    const seen = new Set();
    return sources.filter((source) => {
        const key = source.fileId || source.title;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function isToolSuccess(toolResult) {
    return toolResult?.success === true;
}

function getToolErrorMessage(toolResult) {
    if (!toolResult?.error) return 'Unknown error';
    if (typeof toolResult.error === 'string') return toolResult.error;
    return toolResult.error.message || JSON.stringify(toolResult.error);
}

function logToolResult(toolName, toolResult) {
    if (isToolSuccess(toolResult)) {
        console.log(`[Tool] ${toolName} completed`);
        if (toolResult.artifact?.artifact_id) {
            console.log(`[Artifact] Created: ${toolResult.artifact.artifact_id}`);
        }
        if (toolResult.verified) {
            console.log('[Agent] Verification successful');
        }
    } else {
        console.log(`[Tool] ${toolName} failed: ${getToolErrorMessage(toolResult)}`);
    }
}

function recordGenerationSuccess(generationState, toolName, toolResult) {
    if (!isToolSuccess(toolResult)) return;
    const artifact = toolResult.artifact || {
        artifact_id: toolResult.artifact_id,
        file_name: toolResult.fileName,
        mime_type: toolResult.mimeType,
        size: toolResult.size
    };
    if (!artifact?.artifact_id) return;

    if (toolName === 'generate_docx') {
        generationState.docx = artifact;
    } else if (toolName === 'generate_pdf') {
        generationState.pdf = artifact;
    }
}

function getExistingGenerationArtifact(generationState, toolName) {
    if (toolName === 'generate_docx' && generationState.docx) {
        return generationState.docx;
    }
    if (toolName === 'generate_pdf' && generationState.pdf) {
        return generationState.pdf;
    }
    return null;
}

function buildIdempotentGenerationResult(toolName, artifact) {
    return {
        success: true,
        artifact: {
            artifact_id: artifact.artifact_id,
            file_name: artifact.file_name || artifact.fileName,
            mime_type: artifact.mime_type || artifact.mimeType,
            size: artifact.size
        },
        artifact_id: artifact.artifact_id,
        fileName: artifact.file_name || artifact.fileName,
        mimeType: artifact.mime_type || artifact.mimeType,
        size: artifact.size,
        format: toolName === 'generate_pdf' ? 'pdf' : 'docx',
        idempotent: true,
        message: 'Document was already generated in this request. Reusing existing artifact.'
    };
}

function truncateToolResultForContext(toolName, toolResult) {
    if (!toolResult || toolResult.success === false) {
        return toolResult;
    }

    if (GENERATION_TOOLS.has(toolName)) {
        return {
            success: true,
            artifact_id: toolResult.artifact_id || toolResult.artifact?.artifact_id,
            file_name: toolResult.artifact?.file_name || toolResult.fileName,
            format: toolResult.format,
            download_url: toolResult.download_url || toolResult.artifact?.download_url
        };
    }

    if (toolName === 'drive_read_file') {
        const text = toolResult.text || '';
        return {
            success: true,
            file: toolResult.file ? { id: toolResult.file.id, name: toolResult.file.name } : undefined,
            text: text.length > 2000 ? `${text.slice(0, 2000)}...[truncated]` : text,
            truncated: text.length > 2000
        };
    }

    if (toolName === 'drive_search' || toolName === 'drive_list_files') {
        const files = (toolResult.files || []).slice(0, 5).map((f) => ({
            id: f.id,
            name: f.name,
            webViewLink: f.webViewLink
        }));
        return { success: true, files };
    }

    if (toolName === 'search_project_knowledge') {
        const results = (toolResult.results || []).slice(0, 5).map((r) => ({
            sourceType: r.sourceType,
            sourceLabel: r.sourceLabel || r.fileName,
            section: r.section,
            snippet: (r.content || r.text || r.snippet || '').slice(0, 400),
            score: r.score,
            fileId: r.fileId
        }));
        return { success: true, results };
    }

    if (toolName === 'drive_upload_file' && toolResult.file) {
        return {
            success: true,
            verified: toolResult.verified,
            file: {
                id: toolResult.file.id,
                name: toolResult.file.name,
                webViewLink: toolResult.file.webViewLink
            }
        };
    }

    if (toolName === 'drive_get_file' && toolResult.file) {
        return {
            success: true,
            verified: toolResult.verified,
            file: {
                id: toolResult.file.id,
                name: toolResult.file.name,
                webViewLink: toolResult.file.webViewLink
            }
        };
    }

    if (toolName === 'github_get_file') {
        const text = toolResult.text || '';
        return {
            success: true,
            file: toolResult.file,
            text: text.length > 2500 ? `${text.slice(0, 2500)}...[truncated]` : text,
            truncated: text.length > 2500 || toolResult.file?.truncated,
            relationships: toolResult.relationships
                ? {
                    imports: (toolResult.relationships.imports || []).slice(0, 20),
                    exports: (toolResult.relationships.exports || []).slice(0, 20),
                    usedBy: (toolResult.relationships.usedBy || []).slice(0, 20)
                }
                : undefined
        };
    }

    if (toolName === 'github_list_files') {
        return {
            success: true,
            path: toolResult.path,
            entries: (toolResult.entries || []).slice(0, 40).map((e) => ({
                name: e.name,
                path: e.path,
                type: e.type
            }))
        };
    }

    if (toolName === 'github_list_commits' || toolName === 'github_get_file_history') {
        return {
            success: true,
            commits: (toolResult.commits || []).slice(0, 10).map((c) => ({
                sha: c.shortSha || String(c.sha || '').slice(0, 7),
                message: String(c.message || '').slice(0, 180),
                author: c.author,
                date: c.date
            }))
        };
    }

    if (toolName === 'github_get_commit') {
        return {
            success: true,
            commit: {
                sha: toolResult.commit?.sha,
                message: toolResult.commit?.message,
                author: toolResult.commit?.author,
                date: toolResult.commit?.date,
                stats: toolResult.commit?.stats,
                files: (toolResult.commit?.files || []).slice(0, 20).map((f) => ({
                    filename: f.filename,
                    status: f.status,
                    additions: f.additions,
                    deletions: f.deletions,
                    patch: f.patch ? String(f.patch).slice(0, 1200) : null
                }))
            },
            traceability: toolResult.traceability
        };
    }

    if (toolName === 'github_list_pull_requests') {
        return {
            success: true,
            pullRequests: (toolResult.pullRequests || []).slice(0, 12).map((p) => ({
                number: p.number,
                title: p.title,
                state: p.state,
                author: p.author,
                mergedAt: p.mergedAt
            }))
        };
    }

    if (toolName === 'github_get_pull_request') {
        const pr = toolResult.pullRequest || {};
        return {
            success: true,
            pullRequest: {
                number: pr.number,
                title: pr.title,
                body: String(pr.body || '').slice(0, 1500),
                state: pr.state,
                author: pr.author,
                labels: pr.labels,
                files: (pr.files || []).slice(0, 20).map((f) => f.filename),
                commits: (pr.commits || []).slice(0, 10).map((c) => ({
                    sha: String(c.sha || '').slice(0, 7),
                    message: String(c.message || '').slice(0, 120)
                }))
            },
            traceability: toolResult.traceability
        };
    }

    if (toolName.startsWith('github_')) {
        const copy = { ...toolResult };
        delete copy.source;
        return copy;
    }

    return toolResult;
}

async function callGroqWithTools(groq, params, allowedToolNames = [], profileLabel = 'chat') {
    // Deterministic model routing heuristics
    const isComplex = profileLabel === 'full' || 
                      (params.tools || []).length > 3 || 
                      (params.tools || []).some(t => t.function.name.startsWith('github_') && t.function.name !== 'github_get_file');
    
    const targetModel = isComplex 
        ? config.complexAgentModel
        : config.agentModel;

    const request = {
        model: targetModel,
        messages: params.messages,
        max_tokens: params.max_tokens || 1024
    };

    if (params.tools?.length > 0) {
        request.tools = params.tools;
        request.tool_choice = params.tool_choice || 'auto';
    }

    try {
        return await safeGroqCompletion(request);
    } catch (error) {
        if (isInvalidToolInRequestError(error)) {
            const match = (error.message || '').match(/tool '([^']+)'/i);
            const blocked = match?.[1] || 'unknown';
            console.warn('[Agent] Groq rejected unavailable tool:', blocked);
            throw Object.assign(new Error(`TOOL_NOT_IN_REQUEST:${blocked}`), { blockedTool: blocked, originalError: error });
        }

        if (!isGroqToolUseFailedError(error)) {
            throw error;
        }

        const parsedTool = recoverToolCallFromError(error, allowedToolNames);
        if (parsedTool) {
            console.warn('[Agent] Recovered malformed tool call:', parsedTool.toolName);
            return {
                choices: [{
                    message: {
                        content: '',
                        tool_calls: [{
                            id: `recovered_${Date.now()}`,
                            type: 'function',
                            function: {
                                name: parsedTool.toolName,
                                arguments: JSON.stringify(parsedTool.toolArgs)
                            }
                        }]
                    }
                }]
            };
        }

        throw error;
    }
}

async function executeAgentTool(toolName, toolArgs, context) {
    const { userId, projectId, project, groq } = context;

    if (toolName === 'generate_docx' || toolName === 'generate_pdf') {
        return executeDocumentTool(toolName, toolArgs, context);
    }

    if (toolName === 'send_document_email') {
        return executeEmailTool(toolName, toolArgs, context);
    }

    if (toolName.startsWith('drive_') || toolName === 'search_project_knowledge') {
        return executeDriveTool(toolName, toolArgs, { userId, projectId });
    }

    if (toolName.startsWith('github_')) {
        return executeGithubTool(toolName, toolArgs, { userId, projectId, githubContext: context.githubContext });
    }

    return executeLegacyTool(toolName, toolArgs, { projectId, userId, project, groq });
}

function resolveArtifactIdInToolArgs(toolName, toolArgs, context, generationState = null) {
    if (toolName !== 'drive_upload_file' && toolName !== 'send_document_email') {
        return toolArgs;
    }
    const id = toolArgs.artifact_id;
    if (isValidArtifactIdFormat(id)) {
        return toolArgs;
    }

    const fromGeneration = generationState?.pdf || generationState?.docx;
    if (fromGeneration?.artifact_id) {
        return { ...toolArgs, artifact_id: fromGeneration.artifact_id };
    }

    if (context.currentArtifact?.artifact_id) {
        return { ...toolArgs, artifact_id: context.currentArtifact.artifact_id };
    }
    return toolArgs;
}

async function findPendingAction(userId, projectId, conversationId) {
    if (!conversationId) return null;
    return PendingAIAction.findOne({
        userId,
        projectId,
        conversationId,
        status: 'pending'
    });
}

async function validateBeforeHITL(toolName, toolArgs, context, generationState = null) {
    if (toolName === 'drive_upload_file') {
        const resolvedArgs = resolveArtifactIdInToolArgs(toolName, toolArgs, context, generationState);
        if (!resolvedArgs.artifact_id) {
            if (resolvedArgs.content) {
                return { valid: true };
            }
            return {
                valid: false,
                error: {
                    code: 'INVALID_ARTIFACT_ID',
                    message: 'artifact_id is required for generated document uploads.',
                    retryable: true
                }
            };
        }

        const validation = validateArtifactForUpload(
            context.userId,
            context.projectId,
            resolvedArgs.artifact_id,
            resolvedArgs.mime_type || null
        );

        if (!validation.valid) {
            return validation;
        }

        return { valid: true, meta: validation.meta, resolvedArgs };
    }

    if (toolName === 'send_document_email') {
        const resolvedArgs = resolveArtifactIdInToolArgs(toolName, toolArgs, context, generationState);
        if (!isValidArtifactIdFormat(resolvedArgs.artifact_id)) {
            return {
                valid: false,
                error: {
                    code: 'ARTIFACT_REQUIRED',
                    message: 'No valid document artifact yet. Call generate_docx or generate_pdf first with the content to email, then call send_document_email with the exact artifact_id (art_...) from that tool result.',
                    retryable: true
                }
            };
        }
        const validation = validateArtifactForUpload(
            context.userId,
            context.projectId,
            resolvedArgs.artifact_id
        );
        if (!validation.valid) {
            return validation;
        }
        if (!resolvedArgs.recipient_email) {
            return {
                valid: false,
                error: {
                    code: 'INVALID_EMAIL',
                    message: 'recipient_email is required.',
                    retryable: true
                }
            };
        }
        return { valid: true, meta: validation.meta, resolvedArgs };
    }

    return { valid: true };
}

async function createPendingAction(userId, projectId, conversationId, toolName, toolArgs, description, agentState) {
    return PendingAIAction.create({
        userId,
        projectId,
        conversationId,
        toolName,
        toolArgs,
        description,
        agentState,
        expiresAt: new Date(Date.now() + HITL_TTL_MS)
    });
}

async function runNeuralAgent({
    groq,
    systemPrompt,
    userMessages,
    tools,
    context,
    initialConversation = null,
    initialSources = [],
    initialActions = [],
    initialToolTrace = [],
    initialGenerationState = null
}) {
    const allowedToolNames = getToolNamesFromDefinitions(tools);
    const conversation = initialConversation
        ? [...initialConversation]
        : cleanMessages(userMessages, allowedToolNames);
    const sources = [...initialSources];
    const actionsTaken = [...initialActions];
    const toolTrace = [...(initialToolTrace || [])];
    const generationState = initialGenerationState
        ? { ...initialGenerationState }
        : createGenerationState();
    const seenCalls = new Set();
    let knowledgeSearches = 0;
    let iteration = 0;

    console.log('[Agent] User request received');
    if (allowedToolNames.length) {
        console.log(`[Agent] Allowed tools (${allowedToolNames.length}): ${allowedToolNames.join(', ')}`);
    }

    while (iteration < MAX_AGENT_ITERATIONS) {
        iteration += 1;
        console.log(`[Agent] Planning/tool selection (iteration ${iteration})`);

        let response;
        try {
            response = await callGroqWithTools(groq, {
                messages: [systemPrompt, ...conversation],
                tools,
                tool_choice: 'auto'
            }, allowedToolNames, context.toolProfile || 'chat');
        } catch (groqError) {
            if (groqError.message?.startsWith('TOOL_NOT_IN_REQUEST:')) {
                const blockedTool = groqError.blockedTool || groqError.message.split(':')[1];
                const failure = buildUnavailableToolError(blockedTool, allowedToolNames);
                conversation.push({
                    role: 'user',
                    content: `System: ${failure.error.message} Continue with available tools only.`
                });
                continue;
            }
            throw groqError;
        }

        const assistantMessage = response.choices[0].message;

        if (!assistantMessage.tool_calls?.length) {
            console.log('[Agent] Final response generated');
            return {
                reply: assistantMessage.content || 'I completed the request.',
                sources: dedupeSources(sources),
                actions_taken: actionsTaken,
                tool_trace: toolTrace,
                generationState
            };
        }

        conversation.push({
            role: 'assistant',
            content: assistantMessage.content || '',
            tool_calls: assistantMessage.tool_calls.map((tc) => ({
                id: tc.id,
                type: tc.type,
                function: {
                    name: tc.function.name,
                    arguments: tc.function.arguments
                }
            }))
        });

        for (const toolCall of assistantMessage.tool_calls) {
            const rawToolName = toolCall.function.name;
            const toolName = normalizeToolName(rawToolName, allowedToolNames);

            if (!toolName) {
                console.warn(`[Agent] Blocked unavailable tool: ${rawToolName}`);
                const failure = buildUnavailableToolError(rawToolName, allowedToolNames);
                conversation.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(failure)
                });
                toolTrace.push({
                    name: rawToolName,
                    success: false,
                    error: failure.error?.message || 'Tool not available'
                });
                logToolResult(rawToolName, failure);
                continue;
            }

            let toolArgs;

            try {
                toolArgs = JSON.parse(toolCall.function.arguments || '{}');
            } catch (parseError) {
                console.error(`[Agent] Malformed tool arguments for ${toolName}`);
                const failure = {
                    success: false,
                    error: {
                        code: 'MALFORMED_ARGS',
                        message: 'Malformed tool arguments. Reformulate the tool call with valid JSON parameters.',
                        retryable: true
                    }
                };
                conversation.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(failure)
                });
                logToolResult(toolName, failure);
                continue;
            }

            const normalizedQuery = toolName === 'search_project_knowledge'
                ? String(toolArgs.query || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
                : '';
            const callSignature = toolName === 'search_project_knowledge'
                ? `search_project_knowledge:${normalizedQuery}`
                : `${toolName}:${JSON.stringify(toolArgs)}`;
            if (seenCalls.has(callSignature) || (toolName === 'search_project_knowledge' && knowledgeSearches >= 2)) {
                console.warn(`[Agent] Duplicate or excess tool call skipped: ${toolName}`);
                const failure = {
                    success: false,
                    error: {
                        code: 'STOP_SEARCHING',
                        message: 'Do not search project knowledge again. Answer now from prior tool results and compact project context. If you need source code, call github_get_file with a full path including extension.',
                        retryable: false
                    }
                };
                conversation.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(failure)
                });
                logToolResult(toolName, failure);
                continue;
            }
            seenCalls.add(callSignature);
            if (toolName === 'search_project_knowledge') knowledgeSearches += 1;

            console.log(`[Agent] Tool requested: ${toolName}`);

            if (GENERATION_TOOLS.has(toolName)) {
                const existingArtifact = getExistingGenerationArtifact(generationState, toolName);
                if (existingArtifact) {
                    const idempotentResult = buildIdempotentGenerationResult(toolName, existingArtifact);
                    actionsTaken.push(toolName);
                    toolTrace.push({
                        name: toolName,
                        success: true,
                        error: null,
                        idempotent: true
                    });
                    conversation.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        content: JSON.stringify(idempotentResult)
                    });
                    logToolResult(toolName, idempotentResult);
                    continue;
                }
            }

            if (isWriteTool(toolName)) {
                const hitlValidation = await validateBeforeHITL(toolName, toolArgs, context, generationState);
                if (!hitlValidation.valid) {
                    const failure = {
                        success: false,
                        error: hitlValidation.error
                    };
                    conversation.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        content: JSON.stringify(failure)
                    });
                    toolTrace.push({
                        name: toolName,
                        success: false,
                        error: getToolErrorMessage(failure)
                    });
                    logToolResult(toolName, failure);
                    continue;
                }

                const existingPending = await findPendingAction(
                    context.userId,
                    context.projectId,
                    context.conversationId
                );
                if (existingPending) {
                    console.log('[Policy] Blocked: conversation already has pending HITL action');
                    return {
                        reply: 'You have a pending approval for this conversation. Please approve or reject it before starting another action.',
                        pending_action: {
                            id: existingPending._id.toString(),
                            toolName: existingPending.toolName,
                            toolArgs: existingPending.toolArgs,
                            description: existingPending.description,
                            requires_approval: true,
                            existing: true
                        },
                        sources: dedupeSources(sources),
                        actions_taken: actionsTaken,
                        tool_trace: toolTrace,
                        generationState
                    };
                }

                let metadata = null;
                if (toolArgs.file_id) {
                    try {
                        metadata = await googleDriveConnector.getFileMetadata(context.userId, toolArgs.file_id);
                    } catch (e) {
                        metadata = null;
                    }
                }

                const resolvedToolArgs = hitlValidation.resolvedArgs || toolArgs;

                const pending = await createPendingAction(
                    context.userId,
                    context.projectId,
                    context.conversationId || null,
                    toolName,
                    resolvedToolArgs,
                    buildApprovalDescription(toolName, resolvedToolArgs, metadata),
                    {
                        conversation,
                        sources,
                        actionsTaken,
                        toolTrace,
                        generationState,
                        currentArtifact: context.currentArtifact || null,
                        pendingToolCallId: toolCall.id,
                        systemPrompt,
                        toolProfile: context.toolProfile || 'full',
                        capabilities: context.capabilities || []
                    }
                );

                console.log(`[Policy] HITL required for: ${toolName}`);
                console.log('[Policy] Awaiting approval');
                return {
                    reply: `I need your approval before I can ${toolName.replace(/drive_/g, '').replace(/_/g, ' ')}. Please review the request below.`,
                    pending_action: {
                        id: pending._id.toString(),
                        toolName,
                        toolArgs: resolvedToolArgs,
                        description: pending.description,
                        requires_approval: true
                    },
                    sources: dedupeSources(sources),
                    actions_taken: actionsTaken,
                    tool_trace: toolTrace,
                    generationState
                };
            }

            const toolResult = await executeAgentTool(toolName, toolArgs, context);
            actionsTaken.push(toolName);
            toolTrace.push({
                name: toolName,
                success: isToolSuccess(toolResult),
                error: isToolSuccess(toolResult) ? null : getToolErrorMessage(toolResult)
            });

            if (GENERATION_TOOLS.has(toolName)) {
                if (isToolSuccess(toolResult)) {
                    recordGenerationSuccess(generationState, toolName, toolResult);
                    if (context.conversationId && toolResult.artifact_id) {
                        context.currentArtifact = {
                            artifact_id: toolResult.artifact_id,
                            file_name: toolResult.fileName || toolResult.artifact?.file_name,
                            mime_type: toolResult.mimeType || toolResult.artifact?.mime_type,
                            format: toolResult.format,
                            size: toolResult.size,
                            download_url: toolResult.download_url || toolResult.artifact?.download_url
                        };
                    }
                } else {
                    console.log('[Agent] Upload skipped because artifact generation failed');
                }
            }

            collectSources(toolResult, sources);

            const contextPayload = truncateToolResultForContext(toolName, toolResult);
            conversation.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify(contextPayload)
            });

            logToolResult(toolName, toolResult);
        }
    }

    console.warn('[Agent] Maximum iteration limit reached');
    return {
        reply: 'I reached the maximum number of steps for this request. Please try a more specific follow-up if you need more detail.',
        sources: dedupeSources(sources),
        actions_taken: actionsTaken,
        tool_trace: toolTrace,
        generationState
    };
}

async function resumeAgentAfterApproval({
    groq,
    systemPrompt,
    tools,
    context,
    agentState,
    toolName,
    toolResult,
    pendingToolCallId
}) {
    const conversation = [...(agentState.conversation || [])];
    const sources = [...(agentState.sources || [])];
    const actionsTaken = [...(agentState.actionsTaken || []), toolName];
    const generationState = agentState.generationState || createGenerationState();
    const toolTrace = [...(agentState.toolTrace || []), {
        name: toolName,
        success: isToolSuccess(toolResult),
        error: isToolSuccess(toolResult) ? null : getToolErrorMessage(toolResult)
    }];

    collectSources(toolResult, sources);

    const contextPayload = truncateToolResultForContext(toolName, toolResult);
    conversation.push({
        role: 'tool',
        tool_call_id: pendingToolCallId || `approved_${Date.now()}`,
        content: JSON.stringify(contextPayload)
    });

    console.log('[Policy] Approved');
    logToolResult(toolName, toolResult);
    console.log(`[Agent] Resuming after HITL approval for: ${toolName}`);

    return runNeuralAgent({
        groq,
        systemPrompt: agentState.systemPrompt || systemPrompt,
        userMessages: [],
        tools,
        context: { ...context, toolProfile: agentState.toolProfile || context.toolProfile || 'full', capabilities: agentState.capabilities || context.capabilities },
        initialConversation: conversation,
        initialSources: sources,
        initialActions: actionsTaken,
        initialToolTrace: toolTrace,
        initialGenerationState: generationState
    });
}

async function resumeAgentAfterRejection({
    groq,
    systemPrompt,
    tools,
    context,
    agentState,
    toolName,
    pendingToolCallId
}) {
    const conversation = [...(agentState.conversation || [])];
    const sources = [...(agentState.sources || [])];
    const actionsTaken = [...(agentState.actionsTaken || [])];
    const generationState = agentState.generationState || createGenerationState();
    const toolTrace = [...(agentState.toolTrace || []), {
        name: toolName,
        success: false,
        error: 'User rejected this action'
    }];

    const rejectionResult = {
        success: false,
        error: {
            code: 'USER_REJECTED',
            message: 'User rejected this action. The operation was not performed. Do not claim success. Do not retry unless the user explicitly asks again.',
            retryable: false
        },
        rejected: true
    };

    conversation.push({
        role: 'tool',
        tool_call_id: pendingToolCallId || `rejected_${Date.now()}`,
        content: JSON.stringify(rejectionResult)
    });

    console.log('[Policy] Rejected');
    logToolResult(toolName, rejectionResult);
    console.log(`[Agent] Resuming after HITL rejection for: ${toolName}`);

    return runNeuralAgent({
        groq,
        systemPrompt: agentState.systemPrompt || systemPrompt,
        userMessages: [],
        tools,
        context: { ...context, toolProfile: agentState.toolProfile || context.toolProfile || 'full', capabilities: agentState.capabilities || context.capabilities },
        initialConversation: conversation,
        initialSources: sources,
        initialActions: actionsTaken,
        initialToolTrace: toolTrace,
        initialGenerationState: generationState
    });
}

module.exports = {
    cleanMessages,
    runNeuralAgent,
    resumeAgentAfterApproval,
    resumeAgentAfterRejection,
    findPendingAction,
    MAX_AGENT_ITERATIONS,
    createGenerationState
};
