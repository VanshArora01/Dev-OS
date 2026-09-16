const WRITE_TOOLS = new Set([
    'drive_create_file',
    'drive_upload_file',
    'drive_update_file',
    'drive_rename_file',
    'drive_move_file',
    'drive_delete_file',
    'drive_create_folder',
    'send_document_email'
]);

function getProjectKnowledgeTools() {
    return [{
        type: 'function',
        function: {
            name: 'search_project_knowledge',
            description: 'Search project knowledge from PRD, indexed Google Drive documents, and indexed GitHub source files. Use SHORT semantic queries. Returns grounded snippets with source labels (PRD, Drive, or GitHub paths).',
            parameters: {
                type: 'object',
                properties: { query: { type: 'string' } },
                required: ['query']
            }
        }
    }];
}

function getDriveReadTools() {
    return [
        {
            type: 'function',
            function: {
                name: 'drive_search',
                description: 'Search Google Drive. Use a SHORT query for the target document only.',
                parameters: {
                    type: 'object',
                    properties: {
                        query: { type: 'string' },
                        mime_type: { type: 'string' },
                        folder_id: { type: 'string' }
                    },
                    required: ['query']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'drive_list_files',
                description: 'List files in Google Drive.',
                parameters: {
                    type: 'object',
                    properties: {
                        folder_id: { type: 'string' },
                        page_size: { type: 'number' }
                    }
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'drive_get_file',
                description: 'Get file metadata by file_id.',
                parameters: {
                    type: 'object',
                    properties: { file_id: { type: 'string' } },
                    required: ['file_id']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'drive_read_file',
                description: 'Read file text by file_id. Use after drive_search.',
                parameters: {
                    type: 'object',
                    properties: { file_id: { type: 'string' } },
                    required: ['file_id']
                }
            }
        }
    ];
}

function getDriveWriteTools() {
    return [
        {
            type: 'function',
            function: {
                name: 'drive_upload_file',
                description: 'Upload to Drive (requires approval). Use artifact_id from generate_docx/generate_pdf, never filename.',
                parameters: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        artifact_id: { type: 'string' },
                        content: { type: 'string' },
                        mime_type: { type: 'string' },
                        folder_id: { type: 'string' }
                    }
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'drive_create_folder',
                description: 'Create folder (requires approval). Search first; only if user explicitly requests.',
                parameters: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        parent_folder_id: { type: 'string' }
                    },
                    required: ['name']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'drive_create_file',
                description: 'Create text file in Drive (requires approval).',
                parameters: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        content: { type: 'string' },
                        mime_type: { type: 'string' },
                        folder_id: { type: 'string' }
                    },
                    required: ['name', 'content']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'drive_update_file',
                description: 'Update file (requires approval).',
                parameters: {
                    type: 'object',
                    properties: {
                        file_id: { type: 'string' },
                        content: { type: 'string' },
                        mime_type: { type: 'string' }
                    },
                    required: ['file_id']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'drive_rename_file',
                description: 'Rename file (requires approval).',
                parameters: {
                    type: 'object',
                    properties: {
                        file_id: { type: 'string' },
                        new_name: { type: 'string' }
                    },
                    required: ['file_id', 'new_name']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'drive_move_file',
                description: 'Move file (requires approval).',
                parameters: {
                    type: 'object',
                    properties: {
                        file_id: { type: 'string' },
                        folder_id: { type: 'string' }
                    },
                    required: ['file_id', 'folder_id']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'drive_delete_file',
                description: 'Delete file (requires approval).',
                parameters: {
                    type: 'object',
                    properties: { file_id: { type: 'string' } },
                    required: ['file_id']
                }
            }
        }
    ];
}

function getDriveTools() {
    return [...getDriveReadTools(), ...getProjectKnowledgeTools(), ...getDriveWriteTools()];
}

function isWriteTool(toolName) {
    return WRITE_TOOLS.has(toolName);
}

function buildApprovalDescription(toolName, toolArgs, metadata = null) {
    switch (toolName) {
        case 'drive_create_file':
            return `Create file "${toolArgs.name}" in Google Drive${toolArgs.folder_id ? ` (folder: ${toolArgs.folder_id})` : ''}.`;
        case 'drive_upload_file':
            if (toolArgs.artifact_id) {
                return `Upload file "${toolArgs.name || 'generated document'}" to Google Drive${toolArgs.folder_id ? ` (folder: ${toolArgs.folder_id})` : ''} from generated artifact.`;
            }
            return `Upload file "${toolArgs.name}" to Google Drive${toolArgs.folder_id ? ` (folder: ${toolArgs.folder_id})` : ''}.`;
        case 'drive_update_file':
            return `Update file "${metadata?.name || toolArgs.file_id}" in Google Drive.`;
        case 'drive_rename_file':
            return `Rename file "${metadata?.name || toolArgs.file_id}" to "${toolArgs.new_name}".`;
        case 'drive_move_file':
            return `Move file "${metadata?.name || toolArgs.file_id}" to folder ${toolArgs.folder_id}.`;
        case 'drive_delete_file':
            return `Delete file "${metadata?.name || toolArgs.file_id}" from Google Drive.`;
        case 'drive_create_folder':
            return `Create folder "${toolArgs.name}" in Google Drive.`;
        case 'send_document_email':
            return `Email "${toolArgs.artifact_id ? 'document' : 'file'}" to ${toolArgs.recipient_email}.`;
        default:
            return `Execute ${toolName.replace(/_/g, ' ')}.`;
    }
}

module.exports = {
    getDriveTools,
    getDriveReadTools,
    getDriveWriteTools,
    getProjectKnowledgeTools,
    isWriteTool,
    buildApprovalDescription,
    WRITE_TOOLS
};
