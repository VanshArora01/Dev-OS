/**
 * Canonical tool registry — names, aliases, capabilities, and validation helpers.
 */

const TOOL_ALIASES = {
    send_email: 'send_document_email',
    email_document: 'send_document_email',
    send_mail: 'send_document_email',
    mail_document: 'send_document_email',
    email_file: 'send_document_email',
    generate_document: 'generate_docx',
    create_pdf: 'generate_pdf',
    create_docx: 'generate_docx'
};

const TOOL_CAPABILITIES = {
    search_project_knowledge: 'knowledge',
    create_reminder: 'project_action',
    mark_milestone_done: 'project_action',
    log_work_session: 'project_action',
    send_standup_email: 'project_action',
    drive_search: 'drive_read',
    drive_list_files: 'drive_read',
    drive_get_file: 'drive_read',
    drive_read_file: 'drive_read',
    drive_download_file: 'drive_read',
    drive_create_file: 'drive_write',
    drive_upload_file: 'drive_write',
    drive_update_file: 'drive_write',
    drive_rename_file: 'drive_write',
    drive_move_file: 'drive_write',
    drive_delete_file: 'drive_write',
    drive_create_folder: 'drive_write',
    generate_docx: 'document',
    generate_pdf: 'document',
    send_document_email: 'email',
    github_list_repositories: 'github',
    github_get_repository: 'github',
    github_list_files: 'github',
    github_get_file: 'github',
    github_get_file_history: 'github',
    github_list_commits: 'github',
    github_get_commit: 'github',
    github_list_pull_requests: 'github',
    github_get_pull_request: 'github',
    github_list_branches: 'github',
    github_list_issues: 'github',
    github_search_code: 'github'
};

const HITL_TOOLS = new Set([
    'drive_create_file',
    'drive_upload_file',
    'drive_update_file',
    'drive_rename_file',
    'drive_move_file',
    'drive_delete_file',
    'drive_create_folder',
    'send_document_email'
]);

const GENERATION_TOOLS = new Set(['generate_docx', 'generate_pdf']);

const ALL_CANONICAL_TOOLS = new Set(Object.keys(TOOL_CAPABILITIES));

function getToolNamesFromDefinitions(tools = []) {
    return tools
        .map((t) => t?.function?.name)
        .filter(Boolean);
}

function normalizeToolName(toolName, allowedToolNames = null) {
    if (!toolName || typeof toolName !== 'string') return null;
    const trimmed = toolName.trim();
    const lower = trimmed.toLowerCase();
    const aliased = TOOL_ALIASES[lower] || TOOL_ALIASES[trimmed] || trimmed;

    if (!ALL_CANONICAL_TOOLS.has(aliased)) {
        return null;
    }

    if (allowedToolNames) {
        const allowed = new Set(allowedToolNames);
        if (!allowed.has(aliased)) return null;
    }

    return aliased;
}

function isToolAllowed(toolName, allowedToolNames) {
    const normalized = normalizeToolName(toolName, allowedToolNames);
    return Boolean(normalized);
}

function buildUnavailableToolError(toolName, allowedToolNames) {
    const available = (allowedToolNames || []).slice(0, 12).join(', ');
    return {
        success: false,
        error: {
            code: 'TOOL_NOT_AVAILABLE',
            message: `Tool "${toolName}" is not available for this request. Use only: ${available}${allowedToolNames.length > 12 ? '…' : ''}. For email attachments use send_document_email (not send_email).`,
            retryable: true
        }
    };
}

module.exports = {
    TOOL_ALIASES,
    TOOL_CAPABILITIES,
    HITL_TOOLS,
    GENERATION_TOOLS,
    ALL_CANONICAL_TOOLS,
    getToolNamesFromDefinitions,
    normalizeToolName,
    isToolAllowed,
    buildUnavailableToolError
};
