const { getGroqClient } = require('../services/groqClient');
const Project = require('../models/Project');
const Session = require('../models/Session');
const PendingAIAction = require('../models/PendingAIAction');
const { getUserIdFromClerkId } = require('../utils/auth');
const { getIntegrationForUser } = require('../services/googleOAuthService');
const { getGithubIntegrationForUser } = require('../services/githubOAuthService');
const { getAgentTools } = require('../services/toolRegistry');
const { resolveAgentCapabilities, capabilitiesFromProfile } = require('../services/agentIntentRouter');
const {
    runNeuralAgent,
    resumeAgentAfterApproval,
    resumeAgentAfterRejection,
    findPendingAction
} = require('../services/neuralAgent');
const { executeDriveTool } = require('../services/driveToolExecutor');
const { executeEmailTool } = require('../services/capabilities/document/emailToolExecutor');
const { isGroqToolUseFailedError, isInvalidToolInRequestError } = require('../services/groqToolRecovery');
const {
    getConversationArtifact,
    setConversationArtifact,
    buildArtifactActionCards
} = require('../services/conversationArtifactService');
const { getArtifactMeta } = require('../services/capabilities/document/artifactStore');
const { buildSystemPrompt, buildWorkspaceSystemPrompt, buildAgentMessages } = require('../services/contextBuilder');
const {
    listConversations,
    getConversation,
    createConversation,
    updateConversation,
    deleteConversation,
    listMessages,
    saveMessage,
    getRecentMessagesForAgent,
    maybeUpdateConversationSummary,
    generateTitleFromMessage,
    formatMessageForClient,
    MESSAGES_PER_PAGE
} = require('../services/conversationService');

async function getProjectContext(userId, projectId) {
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) return null;

    const recentSessions = await Session.find({ projectId, userId }).sort({ createdAt: -1 }).limit(10);
    const driveConnected = Boolean(await getIntegrationForUser(userId));
    const githubConnected = Boolean(await getGithubIntegrationForUser(userId));

    return { project, recentSessions, driveConnected, githubConnected };
}

async function getWorkspaceContext(userId) {
    const projects = await Project.find({ userId }).sort({ lastWorkedAt: -1 }).lean();
    const recentSessions = await Session.find({ userId }).sort({ createdAt: -1 }).limit(20).populate('projectId', 'name').lean();
    const driveConnected = Boolean(await getIntegrationForUser(userId));
    const githubConnected = Boolean(await getGithubIntegrationForUser(userId));
    return { workspace: true, project: null, projects, recentSessions, driveConnected, githubConnected };
}

function isWorkspaceRequest(payload = {}) {
    return payload.surface === 'workspace' || payload.projectId === 'workspace';
}

function buildToolPersistence(toolTrace = []) {
    const toolCalls = toolTrace.map((t) => ({ name: t.name }));
    const toolResults = toolTrace.map((t) => ({
        name: t.name,
        success: t.success,
        error: t.error || null
    }));
    return { toolCalls, toolResults };
}

async function persistAssistantMessage(conversationId, result, metadata = {}) {
    const { toolCalls, toolResults } = buildToolPersistence(result.tool_trace);

    return saveMessage(conversationId, {
        role: 'assistant',
        content: result.reply,
        toolCalls,
        toolResults,
        sources: result.sources || [],
        metadata: {
            ...metadata,
            actions_taken: result.actions_taken || [],
            pending_action: result.pending_action || null,
            action_cards: result.action_cards || [],
            current_artifact: result.current_artifact || null
        }
    });
}

async function finalizeAgentResult(conversationId, projectId, result, context, extras = {}) {
    let currentArtifact = context.currentArtifact || null;

    if (currentArtifact?.artifact_id) {
        currentArtifact = await setConversationArtifact(conversationId, currentArtifact, projectId);
    } else if (conversationId) {
        currentArtifact = await getConversationArtifact(conversationId);
    }

    const cardExtras = { ...extras };
    if (!cardExtras.drive_url && result.tool_trace?.some((t) => t.name === 'drive_upload_file' && t.success)) {
        const driveSource = result.sources?.find((s) => s.url && s.fileId);
        if (driveSource) {
            cardExtras.drive_url = driveSource.url;
            cardExtras.drive_file_name = driveSource.title;
        }
    }

    result.current_artifact = currentArtifact;
    result.action_cards = buildArtifactActionCards(currentArtifact, cardExtras);
    return result;
}

async function prepareAgentContext(userId, projectId, conversationId, content, ctx, groq, summary = '', githubContext = null) {
    const { project, recentSessions, driveConnected, githubConnected } = ctx;
    const currentArtifact = conversationId
        ? await getConversationArtifact(conversationId)
        : null;
    const { capabilities, profileLabel } = await resolveAgentCapabilities(groq, content, {
        currentArtifact,
        githubContext,
        githubConnected
    });
    console.log(`[Agent] Intent profile: ${profileLabel}`);
    const promptExtras = { githubConnected, githubContext, capabilities };
    const systemPrompt = ctx.workspace
        ? buildWorkspaceSystemPrompt(ctx, driveConnected, summary, profileLabel, promptExtras)
        : buildSystemPrompt(
            project,
            recentSessions,
            driveConnected,
            summary,
            profileLabel,
            currentArtifact,
            promptExtras
        );
    const tools = getAgentTools({ driveConnected, githubConnected, capabilities });
    const context = {
        userId,
        projectId: projectId || null,
        project,
        groq,
        conversationId,
        toolProfile: profileLabel,
        capabilities,
        currentArtifact,
        githubContext,
        recentSessions: recentSessions || [],
        lastUserMessage: content || ''
    };
    return { systemPrompt, tools, context, toolProfile: profileLabel, capabilities };
}

function appendClerkIdToCards(result, clerkId) {
    if (!clerkId || !result?.action_cards) return;
    result.action_cards = result.action_cards.map((card) => {
        if (card.download_url) {
            const sep = card.download_url.includes('?') ? '&' : '?';
            return { ...card, download_url: `${card.download_url}${sep}clerkId=${encodeURIComponent(clerkId)}` };
        }
        return card;
    });
    if (result.current_artifact?.download_url) {
        const sep = result.current_artifact.download_url.includes('?') ? '&' : '?';
        result.current_artifact.download_url = `${result.current_artifact.download_url}${sep}clerkId=${encodeURIComponent(clerkId)}`;
    }
}

async function executeApprovedTool(pending, userId, projectId, currentArtifact) {
    const execContext = {
        userId,
        projectId,
        currentArtifact: pending.agentState?.currentArtifact || currentArtifact
    };
    if (pending.toolName === 'send_document_email') {
        return executeEmailTool(pending.toolName, pending.toolArgs, execContext);
    }
    return executeDriveTool(pending.toolName, pending.toolArgs, { userId, projectId });
}

exports.listConversations = async (req, res) => {
    try {
        const { projectId, surface } = req.query;
        const clerkId = req.headers['x-clerk-id'];
        const userId = await getUserIdFromClerkId(clerkId);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const workspace = surface === 'workspace' || projectId === 'workspace';
        if (!workspace && !projectId) {
            return res.status(400).json({ error: 'projectId is required' });
        }

        const conversations = await listConversations(userId, workspace ? null : projectId, {
            surface: workspace ? 'workspace' : 'project'
        });
        return res.json({ conversations });
    } catch (error) {
        console.error('List conversations error:', error.message);
        res.status(500).json({ error: 'Failed to load conversations' });
    }
};

exports.createConversation = async (req, res) => {
    try {
        const { projectId, title, scope, surface } = req.body;
        const clerkId = req.headers['x-clerk-id'];
        const userId = await getUserIdFromClerkId(clerkId);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const workspace = isWorkspaceRequest(req.body);
        if (!workspace) {
            const project = await Project.findOne({ _id: projectId, userId });
            if (!project) return res.status(404).json({ error: 'Project not found' });
        }

        const conversation = await createConversation(userId, workspace ? null : projectId, title || 'New conversation', {
            scope: scope === 'ephemeral' ? 'ephemeral' : 'persistent',
            surface: workspace ? 'workspace' : 'project'
        });
        return res.status(201).json({ conversation });
    } catch (error) {
        console.error('Create conversation error:', error.message);
        res.status(500).json({ error: 'Failed to create conversation' });
    }
};

exports.getConversation = async (req, res) => {
    try {
        const { id } = req.params;
        const { projectId, surface } = req.query;
        const clerkId = req.headers['x-clerk-id'];
        const userId = await getUserIdFromClerkId(clerkId);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const conversation = await getConversation(userId, projectId, id, surface === 'workspace' ? 'workspace' : undefined);
        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

        return res.json({ conversation });
    } catch (error) {
        console.error('Get conversation error:', error.message);
        res.status(500).json({ error: 'Failed to load conversation' });
    }
};

exports.updateConversation = async (req, res) => {
    try {
        const { id } = req.params;
        const { projectId, title, surface } = req.body;
        const clerkId = req.headers['x-clerk-id'];
        const userId = await getUserIdFromClerkId(clerkId);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const updates = {};
        if (title) updates.title = title.trim();

        const conversation = await updateConversation(userId, projectId, id, updates, surface === 'workspace' ? 'workspace' : undefined);
        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

        return res.json({ conversation });
    } catch (error) {
        console.error('Update conversation error:', error.message);
        res.status(500).json({ error: 'Failed to update conversation' });
    }
};

exports.deleteConversation = async (req, res) => {
    try {
        const { id } = req.params;
        const { projectId, surface } = req.query;
        const clerkId = req.headers['x-clerk-id'];
        const userId = await getUserIdFromClerkId(clerkId);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const conversation = await deleteConversation(userId, projectId, id, surface === 'workspace' ? 'workspace' : undefined);
        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

        return res.json({ success: true });
    } catch (error) {
        console.error('Delete conversation error:', error.message);
        res.status(500).json({ error: 'Failed to delete conversation' });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { id } = req.params;
        const { projectId, limit, before, surface } = req.query;
        const clerkId = req.headers['x-clerk-id'];
        const userId = await getUserIdFromClerkId(clerkId);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const conversation = await getConversation(userId, projectId, id, surface === 'workspace' ? 'workspace' : undefined);
        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

        const messages = await listMessages(id, {
            limit: Number(limit) || MESSAGES_PER_PAGE,
            before
        });

        return res.json({
            messages: messages.map(formatMessageForClient)
        });
    } catch (error) {
        console.error('Get messages error:', error.message);
        res.status(500).json({ error: 'Failed to load messages' });
    }
};

exports.sendMessage = async (req, res) => {
    try {
        const { id } = req.params;
        const { projectId, content, githubContext, surface } = req.body;
        const clerkId = req.headers['x-clerk-id'];

        if (!content?.trim()) {
            return res.status(400).json({ error: 'Message content is required' });
        }

        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ error: 'GROQ_API_KEY is not configured.' });
        }

        const groq = getGroqClient();
        const userId = await getUserIdFromClerkId(clerkId);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const workspace = surface === 'workspace' || projectId === 'workspace';
        const ctx = workspace ? await getWorkspaceContext(userId) : await getProjectContext(userId, projectId);
        if (!ctx || (!workspace && !ctx.project)) return res.status(404).json({ error: workspace ? 'Workspace not found' : 'Project not found' });

        const conversation = await getConversation(userId, workspace ? null : projectId, id, workspace ? 'workspace' : undefined);
        if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

        const existingPending = await findPendingAction(userId, projectId, id);
        if (existingPending) {
            return res.status(409).json({
                error: 'You have a pending approval for this conversation. Please approve or reject it before sending a new message.',
                pending_action: {
                    id: existingPending._id.toString(),
                    toolName: existingPending.toolName,
                    toolArgs: existingPending.toolArgs,
                    description: existingPending.description,
                    requires_approval: true,
                    existing: true
                }
            });
        }

        const userMessage = await saveMessage(id, {
            role: 'user',
            content: content.trim()
        });

        if (conversation.messageCount === 0 || conversation.title === 'New conversation') {
            const title = generateTitleFromMessage(content);
            await updateConversation(userId, projectId, id, { title });
        }

        const summary = await maybeUpdateConversationSummary(groq, id);
        const recentMessages = await getRecentMessagesForAgent(id);
        const agentMessages = buildAgentMessages(recentMessages);

        const { systemPrompt, tools, context } = await prepareAgentContext(
            userId, projectId, id, content.trim(), ctx, groq, summary, githubContext || null
        );

        let result = await runNeuralAgent({
            groq,
            systemPrompt,
            userMessages: agentMessages,
            tools,
            context
        });

        result = await finalizeAgentResult(id, projectId, result, context);
        appendClerkIdToCards(result, clerkId);

        const assistantMessage = await persistAssistantMessage(id, result);

        return res.json({
            conversationId: id,
            userMessage: formatMessageForClient(userMessage),
            message: formatMessageForClient(assistantMessage),
            reply: result.reply,
            action_taken: result.actions_taken?.[result.actions_taken.length - 1],
            action_result: result.actions_taken?.length ? { tools_used: result.actions_taken } : undefined,
            pending_action: result.pending_action,
            sources: result.sources,
            action_cards: result.action_cards,
            current_artifact: result.current_artifact,
            tool_activity: (result.tool_trace || []).map((t) => ({
                toolName: t.name,
                success: t.success
            }))
        });
    } catch (error) {
        console.error('Send message error:', error.message);

        if (isGroqToolUseFailedError(error) || isInvalidToolInRequestError(error)) {
            return res.status(200).json({
                reply: 'I had trouble selecting the right tool for that request. Please try rephrasing your question.'
            });
        }

        res.status(500).json({ error: 'I could not complete that request right now. Please try again.' });
    }
};

exports.chat = async (req, res) => {
    try {
        const { projectId, messages, conversationId, content, githubContext, scope, surface } = req.body;
        const clerkId = req.headers['x-clerk-id'];

        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ error: 'GROQ_API_KEY is not configured.' });
        }

        const groq = getGroqClient();
        const userId = await getUserIdFromClerkId(clerkId);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const workspace = isWorkspaceRequest(req.body);
        const ctx = workspace ? await getWorkspaceContext(userId) : await getProjectContext(userId, projectId);
        if (!ctx || (!workspace && !ctx.project)) {
            return res.status(404).json({ error: workspace ? 'Workspace not found' : 'Project not found' });
        }

        const convSurface = workspace ? 'workspace' : 'project';
        const convScope = scope === 'ephemeral' ? 'ephemeral' : 'persistent';

        let conversation;
        let userContent = content;

        if (conversationId) {
            conversation = await getConversation(userId, workspace ? null : projectId, conversationId, convSurface);
            if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
        }

        if (!userContent && messages?.length) {
            const lastUser = [...messages].reverse().find((m) => m.role === 'user');
            userContent = lastUser?.content;
        }

        if (!userContent?.trim()) {
            return res.status(400).json({ error: 'Message content is required' });
        }

        if (!conversation) {
            conversation = await createConversation(userId, workspace ? null : projectId, 'New conversation', {
                scope: convScope,
                surface: convSurface
            });
        }

        const convId = conversation._id;

        const existingPending = await findPendingAction(userId, projectId, convId);
        if (existingPending) {
            return res.status(409).json({
                error: 'You have a pending approval for this conversation. Please approve or reject it before sending a new message.',
                pending_action: {
                    id: existingPending._id.toString(),
                    toolName: existingPending.toolName,
                    toolArgs: existingPending.toolArgs,
                    description: existingPending.description,
                    requires_approval: true,
                    existing: true
                }
            });
        }

        const userMessage = await saveMessage(convId, {
            role: 'user',
            content: userContent.trim()
        });

        if (conversation.messageCount === 0 || conversation.title === 'New conversation') {
            const title = generateTitleFromMessage(userContent);
            await updateConversation(userId, projectId, convId, { title });
        }

        const summary = await maybeUpdateConversationSummary(groq, convId);
        const recentMessages = await getRecentMessagesForAgent(convId);
        const agentMessages = buildAgentMessages(recentMessages);

        const { systemPrompt, tools, context } = await prepareAgentContext(
            userId, projectId, convId, userContent.trim(), ctx, groq, summary, githubContext || null
        );

        let result = await runNeuralAgent({
            groq,
            systemPrompt,
            userMessages: agentMessages,
            tools,
            context
        });

        result = await finalizeAgentResult(convId, projectId, result, context);
        appendClerkIdToCards(result, clerkId);

        const assistantMessage = await persistAssistantMessage(convId, result);

        return res.json({
            conversationId: convId,
            userMessage: formatMessageForClient(userMessage),
            message: formatMessageForClient(assistantMessage),
            reply: result.reply,
            action_taken: result.actions_taken?.[result.actions_taken.length - 1],
            action_result: result.actions_taken?.length ? { tools_used: result.actions_taken } : undefined,
            pending_action: result.pending_action,
            sources: result.sources,
            action_cards: result.action_cards,
            current_artifact: result.current_artifact,
            tool_activity: (result.tool_trace || []).map((t) => ({
                toolName: t.name,
                success: t.success
            }))
        });
    } catch (error) {
        console.error('AI Controller Error:', error.message);

        if (isGroqToolUseFailedError(error) || isInvalidToolInRequestError(error)) {
            return res.status(200).json({
                reply: 'I had trouble selecting the right tool for that request. Please try rephrasing your question.'
            });
        }

        res.status(500).json({ error: 'I could not complete that request right now. Please try again.' });
    }
};

exports.approveAction = async (req, res) => {
    try {
        const { approvalId, projectId } = req.body;
        const clerkId = req.headers['x-clerk-id'];
        const userId = await getUserIdFromClerkId(clerkId);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const pending = await PendingAIAction.findOne({
            _id: approvalId,
            userId,
            projectId,
            status: 'pending'
        });

        if (!pending) {
            return res.status(404).json({ error: 'Pending action not found or expired.' });
        }

        if (pending.conversationId) {
            const otherPending = await PendingAIAction.findOne({
                userId,
                projectId,
                conversationId: pending.conversationId,
                status: 'pending',
                _id: { $ne: pending._id }
            });
            if (otherPending) {
                return res.status(409).json({
                    error: 'Another pending action exists for this conversation. Resolve it first.',
                    pending_action: {
                        id: otherPending._id.toString(),
                        toolName: otherPending.toolName,
                        description: otherPending.description
                    }
                });
            }
        }

        const conversationId = pending.conversationId || pending.agentState?.conversationId;
        const currentArtifact = conversationId
            ? await getConversationArtifact(conversationId)
            : pending.agentState?.currentArtifact || null;

        const toolResult = await executeApprovedTool(pending, userId, projectId, currentArtifact);

        pending.status = toolResult.success ? 'approved' : 'rejected';
        await pending.save();

        if (!toolResult.success || !pending.agentState) {
            if (conversationId) {
                const failResult = {
                    reply: toolResult.success
                        ? `Approved and completed: ${pending.description}`
                        : `Action failed: ${toolResult.error?.message || toolResult.error}`,
                    tool_trace: [{
                        name: pending.toolName,
                        success: toolResult.success,
                        error: toolResult.error?.message || toolResult.error
                    }],
                    sources: toolResult.file
                        ? [{ title: toolResult.file.name, url: toolResult.file.webViewLink, fileId: toolResult.file.id }]
                        : [],
                    actions_taken: [pending.toolName]
                };
                await finalizeAgentResult(conversationId, projectId, failResult, {
                    currentArtifact
                });
                await persistAssistantMessage(conversationId, failResult, { action_taken: pending.toolName });
            }

            return res.json({
                success: toolResult.success,
                reply: toolResult.success
                    ? `Approved and completed: ${pending.description}`
                    : `Action failed: ${toolResult.error?.message || toolResult.error}`,
                action_taken: pending.toolName,
                action_result: toolResult,
                conversationId
            });
        }

        const ctx = await getProjectContext(userId, projectId);
        const { project, recentSessions, driveConnected, githubConnected } = ctx;
        const summary = conversationId
            ? (await getConversation(userId, projectId, conversationId))?.summary || ''
            : '';
        const toolProfile = pending.agentState?.toolProfile || 'full';
        const capabilities = pending.agentState?.capabilities ||
            capabilitiesFromProfile(toolProfile);
        const systemPrompt = buildSystemPrompt(
            project,
            recentSessions,
            driveConnected,
            summary,
            toolProfile,
            currentArtifact,
            {
                githubConnected,
                githubContext: pending.agentState?.githubContext || null,
                capabilities
            }
        );
        const tools = getAgentTools({ driveConnected, githubConnected, capabilities });
        const groq = getGroqClient();

        let agentResult = await resumeAgentAfterApproval({
            groq,
            systemPrompt,
            tools,
            context: {
                userId,
                projectId,
                project,
                groq,
                conversationId,
                toolProfile,
                capabilities,
                currentArtifact
            },
            agentState: pending.agentState,
            toolName: pending.toolName,
            toolResult,
            pendingToolCallId: pending.agentState.pendingToolCallId
        });

        agentResult = await finalizeAgentResult(conversationId, projectId, agentResult, {
            currentArtifact
        }, pending.toolName === 'send_document_email' && toolResult.success
            ? { email_to: toolResult.emailed_to, email_success: true }
            : pending.toolName === 'drive_upload_file' && toolResult.success && toolResult.file
                ? { drive_url: toolResult.file.webViewLink, drive_file_name: toolResult.file.name }
                : {});
        appendClerkIdToCards(agentResult, clerkId);

        let assistantMessage = null;
        if (conversationId) {
            assistantMessage = await persistAssistantMessage(conversationId, agentResult, {
                action_taken: pending.toolName,
                approved: true
            });
        }

        return res.json({
            success: true,
            conversationId,
            message: assistantMessage ? formatMessageForClient(assistantMessage) : undefined,
            reply: agentResult.reply,
            action_taken: pending.toolName,
            action_result: toolResult,
            sources: agentResult.sources,
            action_cards: agentResult.action_cards,
            current_artifact: agentResult.current_artifact,
            pending_action: agentResult.pending_action || null,
            tool_activity: (agentResult.tool_trace || []).map((t) => ({
                toolName: t.name,
                success: t.success
            }))
        });
    } catch (error) {
        console.error('Approve action error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.rejectAction = async (req, res) => {
    try {
        const { approvalId, projectId } = req.body;
        const clerkId = req.headers['x-clerk-id'];
        const userId = await getUserIdFromClerkId(clerkId);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const pending = await PendingAIAction.findOneAndUpdate(
            { _id: approvalId, userId, projectId, status: 'pending' },
            { status: 'rejected' },
            { new: true }
        );

        if (!pending) {
            return res.status(404).json({ error: 'Pending action not found or expired.' });
        }

        const conversationId = pending.conversationId || pending.agentState?.conversationId;

        if (!pending.agentState) {
            if (conversationId) {
                await persistAssistantMessage(conversationId, {
                    reply: 'Action rejected. No changes were made.',
                    tool_trace: [{ name: pending.toolName, success: false, error: 'User rejected' }],
                    sources: [],
                    actions_taken: ['rejected']
                }, { action_taken: 'rejected' });
            }

            return res.json({
                success: true,
                reply: 'Action rejected. No changes were made to Google Drive.',
                action_taken: 'rejected',
                action_result: { success: true, rejected: true },
                conversationId
            });
        }

        const ctx = await getProjectContext(userId, projectId);
        const { project, recentSessions, driveConnected, githubConnected } = ctx;
        const summary = conversationId
            ? (await getConversation(userId, projectId, conversationId))?.summary || ''
            : '';
        const currentArtifact = conversationId
            ? await getConversationArtifact(conversationId)
            : pending.agentState?.currentArtifact || null;
        const toolProfile = pending.agentState?.toolProfile || 'full';
        const capabilities = pending.agentState?.capabilities ||
            capabilitiesFromProfile(toolProfile);
        const systemPrompt = buildSystemPrompt(
            project,
            recentSessions,
            driveConnected,
            summary,
            toolProfile,
            currentArtifact,
            {
                githubConnected,
                githubContext: pending.agentState?.githubContext || null,
                capabilities
            }
        );
        const tools = getAgentTools({ driveConnected, githubConnected, capabilities });
        const groq = getGroqClient();

        const agentResult = await resumeAgentAfterRejection({
            groq,
            systemPrompt,
            tools,
            context: {
                userId,
                projectId,
                project,
                groq,
                conversationId,
                toolProfile,
                capabilities,
                currentArtifact
            },
            agentState: pending.agentState,
            toolName: pending.toolName,
            pendingToolCallId: pending.agentState.pendingToolCallId
        });

        let assistantMessage = null;
        if (conversationId) {
            assistantMessage = await persistAssistantMessage(conversationId, agentResult, {
                action_taken: 'rejected',
                rejected: true
            });
        }

        return res.json({
            success: true,
            conversationId,
            message: assistantMessage ? formatMessageForClient(assistantMessage) : undefined,
            reply: agentResult.reply,
            action_taken: 'rejected',
            action_result: { success: true, rejected: true },
            sources: agentResult.sources,
            action_cards: agentResult.action_cards,
            current_artifact: agentResult.current_artifact,
            pending_action: agentResult.pending_action || null,
            tool_activity: (agentResult.tool_trace || []).map((t) => ({
                toolName: t.name,
                success: t.success
            }))
        });
    } catch (error) {
        console.error('Reject action error:', error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.downloadArtifact = async (req, res) => {
    try {
        const { artifactId } = req.params;
        const { projectId, clerkId: queryClerkId } = req.query;
        const clerkId = req.headers['x-clerk-id'] || queryClerkId;
        const userId = await getUserIdFromClerkId(clerkId);
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        if (!projectId || !artifactId) {
            return res.status(400).json({ error: 'projectId and artifactId are required' });
        }

        const meta = getArtifactMeta(userId, projectId, artifactId);
        if (!meta?.filePath) {
            return res.status(404).json({ error: 'Artifact not found' });
        }

        res.setHeader('Content-Type', meta.mimeType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${meta.fileName}"`);
        res.sendFile(meta.filePath);
    } catch (error) {
        console.error('Download artifact error:', error.message);
        res.status(500).json({ error: 'Failed to download artifact' });
    }
};
