const { getDriveReadTools, getDriveWriteTools, getProjectKnowledgeTools } = require('./driveToolDefinitions');
const { getSimpleDocumentTools } = require('./capabilities/document/documentToolDefinitions');
const { getGithubReadTools } = require('./githubToolDefinitions');
const { CAPABILITIES, capabilitiesFromProfile } = require('./agentIntentRouter');
const { getToolNamesFromDefinitions } = require('./toolCatalog');

function getBaseTools() {
    return [
        {
            type: 'function',
            function: {
                name: 'create_reminder',
                description: 'Create reminder. Only when user explicitly asks.',
                parameters: {
                    type: 'object',
                    properties: {
                        date: { type: 'string' },
                        message: { type: 'string' }
                    },
                    required: ['date', 'message']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'mark_milestone_done',
                description: 'Mark milestone complete. Only when user explicitly states completion.',
                parameters: {
                    type: 'object',
                    properties: { milestone_title: { type: 'string' } },
                    required: ['milestone_title']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'log_work_session',
                description: 'Log work session. Only when user explicitly reports work to record.',
                parameters: {
                    type: 'object',
                    properties: {
                        summary: { type: 'string' },
                        problems: { type: 'string' },
                        decisions: { type: 'string' },
                        next_step: { type: 'string' },
                        minutes: { type: 'string' }
                    },
                    required: ['summary', 'next_step']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'send_standup_email',
                description: 'Send standup email. Only when user explicitly requests.',
                parameters: {
                    type: 'object',
                    properties: { recipient_email: { type: 'string' } },
                    required: ['recipient_email']
                }
            }
        }
    ];
}

function getEmailTools() {
    return [{
        type: 'function',
        function: {
            name: 'send_document_email',
            description: 'Email a generated document as an attachment. Requires user approval. MUST use artifact_id from generate_docx/generate_pdf (format art_...). Never use filenames or topic names as artifact_id. If no artifact exists yet, call generate_docx or generate_pdf first.',
            parameters: {
                type: 'object',
                properties: {
                    recipient_email: { type: 'string' },
                    artifact_id: { type: 'string', description: 'Exact art_... from generate_docx/generate_pdf or current conversation artifact' },
                    subject: { type: 'string' },
                    greeting: { type: 'string', description: 'e.g. Hi,' },
                    message: { type: 'string', description: 'Short body message' },
                    signoff: { type: 'string' },
                    sender_name: { type: 'string' }
                },
                required: ['recipient_email']
            }
        }
    }];
}

/**
 * Build tool set from capability groups (composable).
 * @param {object} options
 * @param {boolean} options.driveConnected
 * @param {boolean} options.githubConnected
 * @param {string[]} [options.capabilities]
 * @param {string} [options.profile] - legacy single-profile fallback
 */
function getAgentTools({ driveConnected, githubConnected, capabilities, profile = 'full' } = {}) {
    const caps = new Set(
        capabilities?.length ? capabilities : capabilitiesFromProfile(profile)
    );
    const tools = [];

    if (caps.has(CAPABILITIES.PROJECT_ACTION) || caps.has(CAPABILITIES.DRIVE_WRITE)) {
        tools.push(...getBaseTools());
    }

    if (caps.has(CAPABILITIES.KNOWLEDGE)) {
        tools.push(...getProjectKnowledgeTools());
    }

    if (caps.size === 1 && caps.has(CAPABILITIES.KNOWLEDGE)) {
        return dedupeToolsByName(tools);
    }

    if (driveConnected && caps.has(CAPABILITIES.DRIVE_READ)) {
        tools.push(...getDriveReadTools());
    }

    if (driveConnected && caps.has(CAPABILITIES.DRIVE_WRITE)) {
        tools.push(...getDriveWriteTools());
    }

    if (githubConnected && caps.has(CAPABILITIES.GITHUB)) {
        tools.push(...getGithubReadTools());
    }

    if (caps.has(CAPABILITIES.DOCUMENT)) {
        tools.push(...getSimpleDocumentTools());
    }

    if (caps.has(CAPABILITIES.EMAIL)) {
        tools.push(...getEmailTools());
    }

    return dedupeToolsByName(tools);
}

function dedupeToolsByName(tools) {
    const seen = new Set();
    return tools.filter((tool) => {
        const name = tool?.function?.name;
        if (!name || seen.has(name)) return false;
        seen.add(name);
        return true;
    });
}

module.exports = {
    getBaseTools,
    getEmailTools,
    getAgentTools,
    getToolNamesFromDefinitions,
    dedupeToolsByName
};
