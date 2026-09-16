const { getArtifactMeta } = require('./artifactStore');

const ARTIFACT_ID_PATTERN = /^art_\d+_[a-z0-9]{4,8}$/;

function isValidArtifactIdFormat(artifactId) {
    return typeof artifactId === 'string' && ARTIFACT_ID_PATTERN.test(artifactId);
}

function validateArtifactForUpload(userId, projectId, artifactId, expectedMimeType = null) {
    if (!artifactId) {
        return {
            valid: false,
            error: {
                code: 'INVALID_ARTIFACT_ID',
                message: 'artifact_id is required. Use the exact art_... identifier returned by generate_docx or generate_pdf.',
                retryable: true
            }
        };
    }

    if (!isValidArtifactIdFormat(artifactId)) {
        return {
            valid: false,
            error: {
                code: 'INVALID_ARTIFACT_ID',
                message: `Invalid artifact_id "${artifactId}". Must be the exact art_... identifier from generation, not a filename.`,
                retryable: true
            }
        };
    }

    const meta = getArtifactMeta(userId, projectId, artifactId);
    if (!meta) {
        return {
            valid: false,
            error: {
                code: 'ARTIFACT_NOT_FOUND',
                message: `Artifact not found: ${artifactId}. Use the artifact_id from the most recent successful generation result.`,
                retryable: true
            }
        };
    }

    if (expectedMimeType && meta.mimeType && meta.mimeType !== expectedMimeType) {
        return {
            valid: false,
            error: {
                code: 'ARTIFACT_MIME_MISMATCH',
                message: `Artifact mime type ${meta.mimeType} does not match expected ${expectedMimeType}.`,
                retryable: false
            }
        };
    }

    return {
        valid: true,
        meta: {
            artifact_id: artifactId,
            file_name: meta.fileName,
            mime_type: meta.mimeType,
            size: meta.size,
            filePath: meta.filePath
        }
    };
}

module.exports = {
    ARTIFACT_ID_PATTERN,
    isValidArtifactIdFormat,
    validateArtifactForUpload
};
