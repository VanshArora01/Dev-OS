const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const { config } = require('../config/ai');
const { safeGroqCompletion } = require('./groqClient');
const { RECENT_MESSAGES_FOR_AGENT } = require('./contextBuilder');

const SUMMARY_UPDATE_THRESHOLD = 16;
const MESSAGES_PER_PAGE = 50;

const TOOL_LABELS = {
    drive_search: 'Searched Google Drive',
    drive_list_files: 'Listed Drive files',
    drive_get_file: 'Retrieved file metadata',
    drive_read_file: 'Read document',
    drive_download_file: 'Downloaded file',
    drive_create_file: 'Created file',
    drive_upload_file: 'Uploaded file',
    drive_update_file: 'Updated file',
    drive_rename_file: 'Renamed file',
    drive_move_file: 'Moved file',
    drive_delete_file: 'Deleted file',
    drive_create_folder: 'Created folder',
    search_project_knowledge: 'Retrieved project context',
    create_reminder: 'Created reminder',
    mark_milestone_done: 'Marked milestone complete',
    log_work_session: 'Logged work session',
    send_standup_email: 'Sent standup email',
    generate_docx: 'Generated Word document',
    generate_pdf: 'Generated PDF document',
    send_document_email: 'Sent document email'
};

function generateTitleFromMessage(text) {
    let cleaned = text.trim().replace(/\s+/g, ' ');
    const prefixes = [
        /^can you\s+/i,
        /^could you\s+/i,
        /^please\s+/i,
        /^help me\s+/i,
        /^i want to\s+/i,
        /^i need to\s+/i,
        /^find my\s+/i,
        /^find the\s+/i,
        /^show me\s+/i,
        /^tell me\s+/i,
        /^what is\s+/i,
        /^what are\s+/i,
        /^how do i\s+/i,
        /^how to\s+/i
    ];

    for (const prefix of prefixes) {
        cleaned = cleaned.replace(prefix, '');
    }

    cleaned = cleaned.replace(/[?.!]+$/, '').trim();
    cleaned = cleaned.replace(/\s+and summarize section (\d+)/i, ' — Section $1');
    cleaned = cleaned.replace(/\s+in drive$/i, '');

    if (cleaned.length <= 50) {
        return capitalizeTitle(cleaned);
    }

    const truncated = cleaned.slice(0, 50);
    const lastSpace = truncated.lastIndexOf(' ');
    const title = lastSpace > 20 ? truncated.slice(0, lastSpace) : truncated;
    return capitalizeTitle(title);
}

function capitalizeTitle(text) {
    if (!text) return 'New conversation';
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function getToolLabel(toolName) {
    return TOOL_LABELS[toolName] || toolName.replace(/drive_/g, '').replace(/_/g, ' ');
}

function conversationOwnerQuery(userId, projectId, conversationId, surface) {
    const query = { _id: conversationId, userId };
    if (surface === 'workspace' || (!projectId && surface !== 'project')) {
        query.surface = 'workspace';
    } else if (projectId) {
        query.projectId = projectId;
    }
    return query;
}

async function listConversations(userId, projectId, { surface = 'project' } = {}) {
    const query = { userId, scope: { $ne: 'ephemeral' } };
    if (surface === 'workspace') {
        query.surface = 'workspace';
    } else {
        query.projectId = projectId;
        query.surface = { $ne: 'workspace' };
    }
    return Conversation.find(query)
        .sort({ lastMessageAt: -1, updatedAt: -1 })
        .select('_id title summary messageCount lastMessageAt createdAt updatedAt scope surface')
        .lean();
}

async function getConversation(userId, projectId, conversationId, surface) {
    return Conversation.findOne(conversationOwnerQuery(userId, projectId, conversationId, surface)).lean();
}

async function createConversation(userId, projectId, title = 'New conversation', meta = {}) {
    const scope = meta.scope === 'ephemeral' ? 'ephemeral' : 'persistent';
    const surface = meta.surface === 'workspace' ? 'workspace' : 'project';
    return Conversation.create({
        userId,
        projectId: surface === 'workspace' ? null : projectId,
        title,
        scope,
        surface
    });
}

async function updateConversation(userId, projectId, conversationId, updates, surface) {
    return Conversation.findOneAndUpdate(
        conversationOwnerQuery(userId, projectId, conversationId, surface),
        updates,
        { new: true }
    ).lean();
}

async function deleteConversation(userId, projectId, conversationId, surface) {
    const conversation = await Conversation.findOneAndDelete(
        conversationOwnerQuery(userId, projectId, conversationId, surface)
    );
    if (conversation) {
        await Message.deleteMany({ conversationId });
    }
    return conversation;
}

async function listMessages(conversationId, { limit = MESSAGES_PER_PAGE, before } = {}) {
    const query = { conversationId };
    if (before) {
        query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

    return messages.reverse();
}

async function saveMessage(conversationId, messageData) {
    const message = await Message.create({
        conversationId,
        ...messageData
    });

    await Conversation.findByIdAndUpdate(conversationId, {
        $inc: { messageCount: 1 },
        lastMessageAt: new Date()
    });

    return message;
}

async function getRecentMessagesForAgent(conversationId) {
    const messages = await Message.find({ conversationId, role: { $in: ['user', 'assistant'] } })
        .sort({ createdAt: -1 })
        .limit(RECENT_MESSAGES_FOR_AGENT + 4)
        .lean();

    return messages.reverse();
}

async function maybeUpdateConversationSummary(groq, conversationId) {
    const conversation = await Conversation.findById(conversationId);
    if (!conversation || conversation.messageCount < SUMMARY_UPDATE_THRESHOLD) {
        return conversation?.summary || '';
    }

    const allMessages = await Message.find({ conversationId, role: { $in: ['user', 'assistant'] } })
        .sort({ createdAt: 1 })
        .lean();

    if (allMessages.length <= RECENT_MESSAGES_FOR_AGENT) {
        return conversation.summary || '';
    }

    const olderMessages = allMessages.slice(0, -RECENT_MESSAGES_FOR_AGENT);
    if (olderMessages.length === 0) {
        return conversation.summary || '';
    }

    const transcript = olderMessages
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n');

    try {
        const response = await safeGroqCompletion({
            model: config.summaryModel,
            messages: [{
                role: 'user',
                content: `Summarize this conversation excerpt for an AI agent. Preserve: user goals, decisions, important facts, file names referenced, unresolved questions, and conclusions. Be concise (max 300 words).\n\n${transcript}`
            }],
            max_tokens: 400
        });

        const summary = response.choices[0]?.message?.content?.trim() || conversation.summary;
        await Conversation.findByIdAndUpdate(conversationId, { summary });
        return summary;
    } catch (error) {
        console.error('[Conversation] Summary update failed:', error.message);
        return conversation.summary || '';
    }
}

function formatMessageForClient(message) {
    const toolActivity = (message.toolCalls || []).map((tc, i) => ({
        toolName: tc.name || tc.toolName,
        label: getToolLabel(tc.name || tc.toolName),
        success: message.toolResults?.[i]?.success ?? true
    }));

    return {
        _id: message._id,
        role: message.role,
        content: message.content,
        sources: message.sources || [],
        toolActivity,
        metadata: message.metadata || {},
        createdAt: message.createdAt
    };
}

module.exports = {
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
    getToolLabel,
    formatMessageForClient,
    MESSAGES_PER_PAGE
};
