const { normalizeStructuredDocument, validateStructuredDocument } = require('./models/StructuredDocument');
const { renderDocx } = require('./renderers/docxRenderer');
const { renderPdf } = require('./renderers/pdfRenderer');
const { saveArtifact, sanitizeFilename } = require('./artifactStore');
const { buildArtifactDownloadPath } = require('../../conversationArtifactService');
const { clampStructuredDocument } = require('./simpleDocumentParser');

const MIME_TYPES = {
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    pdf: 'application/pdf'
};

function ensureExtension(fileName, ext) {
    const sanitized = sanitizeFilename(fileName);
    if (sanitized.toLowerCase().endsWith(`.${ext}`)) {
        return sanitized;
    }
    return `${sanitized.replace(/\.[^.]+$/, '')}.${ext}`;
}

async function generateDocument(format, rawDocument, outputName, context = {}) {
    const document = clampStructuredDocument(
        normalizeStructuredDocument(rawDocument, context)
    );
    const validation = validateStructuredDocument(document);
    if (!validation.valid) {
        return {
            success: false,
            error: {
                code: 'INVALID_DOCUMENT',
                message: validation.error,
                retryable: true
            }
        };
    }

    const ext = format === 'pdf' ? 'pdf' : 'docx';
    const fileName = ensureExtension(outputName || document.metadata.title, ext);
    const mimeType = MIME_TYPES[ext];

    let buffer;
    try {
        if (format === 'pdf') {
            buffer = await renderPdf(document);
        } else {
            buffer = await renderDocx(document);
        }
    } catch (error) {
        console.error(`[Document] ${format} render failed:`, error.message);
        return {
            success: false,
            error: {
                code: 'RENDER_FAILED',
                message: `Failed to render ${ext.toUpperCase()}: ${error.message}`,
                retryable: true
            }
        };
    }

    if (!buffer || buffer.length < 100) {
        return {
            success: false,
            error: {
                code: 'EMPTY_ARTIFACT',
                message: 'Generated file was empty or invalid',
                retryable: true
            }
        };
    }

    const artifact = saveArtifact(context.userId, context.projectId, buffer, fileName, mimeType, {
        artifact_type: document.metadata.artifactType || document.template || null,
        title: document.metadata.title,
        projectId: context.projectId
    });

    console.log(`[Artifact] Created: ${artifact.artifact_id}`);
    console.log(`[Document] Generated ${ext}: ${artifact.fileName} (${artifact.size} bytes) type=${document.metadata.artifactType || 'structured'}`);

    return {
        success: true,
        artifact: {
            artifact_id: artifact.artifact_id,
            file_name: artifact.fileName,
            mime_type: artifact.mimeType,
            size: artifact.size,
            format: ext,
            artifact_type: document.metadata.artifactType || null,
            title: document.metadata.title,
            download_url: buildArtifactDownloadPath(artifact.artifact_id, context.projectId)
        },
        artifact_id: artifact.artifact_id,
        fileName: artifact.fileName,
        mimeType: artifact.mimeType,
        size: artifact.size,
        format: ext,
        artifact_type: document.metadata.artifactType || null,
        download_url: buildArtifactDownloadPath(artifact.artifact_id, context.projectId)
    };
}

async function generateDocx(rawDocument, outputName, context) {
    return generateDocument('docx', rawDocument, outputName, context);
}

async function generatePdf(rawDocument, outputName, context) {
    return generateDocument('pdf', rawDocument, outputName, context);
}

module.exports = {
    generateDocx,
    generatePdf,
    generateDocument
};
