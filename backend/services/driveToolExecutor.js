const googleDriveConnector = require('./googleDriveConnector');
const { readDriveFileContent } = require('./documentParser');
const { indexDriveFile, searchProjectKnowledge } = require('./ragService');
const { readArtifactBuffer } = require('./capabilities/document/artifactStore');
const { validateArtifactForUpload } = require('./capabilities/document/artifactValidation');

const MAX_SEARCH_QUERY_LENGTH = 300;

function normalizeDriveError(error, code = 'DRIVE_ERROR') {
    if (typeof error === 'object' && error?.code) {
        return { success: false, error };
    }
    const mapped = googleDriveConnector.mapDriveError(error);
    return {
        success: false,
        error: {
            code: mapped.code || code,
            message: mapped.message || (typeof error === 'string' ? error : error?.message || 'Drive operation failed'),
            retryable: mapped.code !== 'NOT_CONNECTED'
        }
    };
}

async function executeDriveTool(toolName, toolArgs, context) {
    const { userId, projectId } = context;

    try {
        switch (toolName) {
            case 'drive_search': {
                const result = await googleDriveConnector.searchFiles(userId, {
                    query: toolArgs.query,
                    mime_type: toolArgs.mime_type,
                    folder_id: toolArgs.folder_id,
                    pageSize: 20
                });
                return { success: true, files: result.files };
            }

            case 'drive_list_files': {
                const result = await googleDriveConnector.listFiles(userId, {
                    filters: toolArgs.folder_id ? { folderId: toolArgs.folder_id } : {},
                    pageSize: toolArgs.page_size || 20
                });
                return { success: true, files: result.files };
            }

            case 'drive_get_file': {
                const file = await googleDriveConnector.getFileMetadata(userId, toolArgs.file_id);
                return { success: true, file, verified: true };
            }

            case 'drive_read_file': {
                const content = await readDriveFileContent(userId, toolArgs.file_id);
                if (content.text && content.text.length >= 20) {
                    await indexDriveFile(userId, projectId, toolArgs.file_id).catch(() => {});
                }
                return {
                    success: true,
                    file: content.metadata,
                    text: content.text,
                    truncated: content.truncated,
                    source: {
                        title: content.metadata.name,
                        url: content.metadata.webViewLink,
                        fileId: content.metadata.id
                    }
                };
            }

            case 'drive_download_file': {
                const content = await readDriveFileContent(userId, toolArgs.file_id);
                return {
                    success: true,
                    file: content.metadata,
                    preview: content.text?.slice(0, 2000) || '',
                    truncated: content.truncated
                };
            }

            case 'drive_create_file': {
                const file = await googleDriveConnector.createFile(userId, {
                    name: toolArgs.name,
                    content: toolArgs.content,
                    mimeType: toolArgs.mime_type || 'text/plain',
                    parents: toolArgs.folder_id ? [toolArgs.folder_id] : undefined
                });
                await indexDriveFile(userId, projectId, file.id).catch(() => {});
                return { success: true, file };
            }

            case 'drive_upload_file': {
                let buffer;
                let mimeType = toolArgs.mime_type || 'text/plain';
                let fileName = toolArgs.name;

                if (toolArgs.artifact_id) {
                    const validation = validateArtifactForUpload(
                        userId,
                        projectId,
                        toolArgs.artifact_id,
                        toolArgs.mime_type || null
                    );
                    if (!validation.valid) {
                        return { success: false, error: validation.error };
                    }

                    const artifact = readArtifactBuffer(userId, projectId, toolArgs.artifact_id);
                    buffer = artifact.buffer;
                    mimeType = toolArgs.mime_type || artifact.mimeType;
                    fileName = fileName || artifact.fileName;
                } else if (toolArgs.content) {
                    buffer = Buffer.from(toolArgs.content, 'utf8');
                } else {
                    return {
                        success: false,
                        error: {
                            code: 'INVALID_ARTIFACT_ID',
                            message: 'Provide artifact_id from generate_docx/generate_pdf or text content for plain-text uploads.',
                            retryable: true
                        }
                    };
                }

                if (!fileName) {
                    return {
                        success: false,
                        error: {
                            code: 'MISSING_FILE_NAME',
                            message: 'File name is required for upload.',
                            retryable: true
                        }
                    };
                }

                const file = await googleDriveConnector.uploadFile(userId, {
                    name: fileName,
                    buffer,
                    mimeType,
                    parents: toolArgs.folder_id ? [toolArgs.folder_id] : undefined
                });
                await indexDriveFile(userId, projectId, file.id).catch(() => {});

                const verifiedFile = await googleDriveConnector.getFileMetadata(userId, file.id);
                return {
                    success: true,
                    file,
                    verified: true,
                    verification: verifiedFile
                };
            }

            case 'drive_update_file': {
                const file = await googleDriveConnector.updateFile(userId, toolArgs.file_id, {
                    content: toolArgs.content,
                    mimeType: toolArgs.mime_type || 'text/plain'
                });
                await indexDriveFile(userId, projectId, file.id).catch(() => {});
                return { success: true, file };
            }

            case 'drive_rename_file': {
                const file = await googleDriveConnector.renameFile(userId, toolArgs.file_id, toolArgs.new_name);
                return { success: true, file };
            }

            case 'drive_move_file': {
                const metadata = await googleDriveConnector.getFileMetadata(userId, toolArgs.file_id);
                const file = await googleDriveConnector.moveFile(
                    userId,
                    toolArgs.file_id,
                    toolArgs.folder_id,
                    metadata.parents || []
                );
                return { success: true, file };
            }

            case 'drive_delete_file': {
                const result = await googleDriveConnector.deleteFile(userId, toolArgs.file_id);
                return { success: true, deleted: result.deleted };
            }

            case 'drive_create_folder': {
                const folder = await googleDriveConnector.createFolder(
                    userId,
                    toolArgs.name,
                    toolArgs.parent_folder_id || null
                );
                return { success: true, folder };
            }

            case 'search_project_knowledge': {
                const query = String(toolArgs.query || '').trim();
                if (!query) {
                    return {
                        success: false,
                        error: {
                            code: 'INVALID_SEARCH_QUERY',
                            message: 'Search query is required.',
                            retryable: true
                        }
                    };
                }
                if (query.length > MAX_SEARCH_QUERY_LENGTH) {
                    return {
                        success: false,
                        error: {
                            code: 'INVALID_SEARCH_QUERY',
                            message: `Search query is too long (${query.length} chars). Maximum is ${MAX_SEARCH_QUERY_LENGTH} characters. Use a short semantic topic only.`,
                            retryable: true
                        }
                    };
                }

                const results = await searchProjectKnowledge(userId, query, { projectId, limit: 5 });
                return {
                    success: true,
                    results,
                    note: results.length
                        ? undefined
                        : 'No indexed knowledge hits. Do not search again with a similar query. Use github_search_code or github_get_file with a full path including extension (.ts, .tsx, .js). Answer from compact project context if that is enough.',
                    sources: results.map((result) => ({
                        title: result.sourceLabel || result.fileName,
                        url: result.webViewLink,
                        fileId: result.fileId,
                        sourceType: result.sourceType,
                        section: result.section,
                        score: result.score
                    }))
                };
            }

            default:
                return {
                    success: false,
                    error: {
                        code: 'UNKNOWN_TOOL',
                        message: `Unknown Drive tool: ${toolName}`,
                        retryable: false
                    }
                };
        }
    } catch (error) {
        return normalizeDriveError(error);
    }
}

module.exports = { executeDriveTool, MAX_SEARCH_QUERY_LENGTH };
