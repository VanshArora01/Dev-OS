const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const googleDriveConnector = require('./googleDriveConnector');

const GOOGLE_DOC_MIME = 'application/vnd.google-apps.document';
const GOOGLE_SHEET_MIME = 'application/vnd.google-apps.spreadsheet';
const GOOGLE_SLIDES_MIME = 'application/vnd.google-apps.presentation';
const GOOGLE_FOLDER_MIME = 'application/vnd.google-apps.folder';

const EXPORT_MIME_MAP = {
    [GOOGLE_DOC_MIME]: 'text/plain',
    [GOOGLE_SHEET_MIME]: 'text/csv',
    [GOOGLE_SLIDES_MIME]: 'text/plain'
};

async function extractTextFromBuffer(buffer, fileName, mimeType) {
    const lowerName = (fileName || '').toLowerCase();

    if (mimeType === 'application/pdf' || lowerName.endsWith('.pdf')) {
        const data = await pdf(buffer);
        return (data.text || '').trim();
    }

    if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        lowerName.endsWith('.docx')
    ) {
        const result = await mammoth.extractRawText({ buffer });
        return (result.value || '').trim();
    }

    if (mimeType === 'text/plain' || lowerName.endsWith('.txt') || lowerName.endsWith('.md') || lowerName.endsWith('.csv')) {
        return buffer.toString('utf8').trim();
    }

    if (mimeType?.startsWith('text/')) {
        return buffer.toString('utf8').trim();
    }

    return '';
}

async function readDriveFileContent(userId, fileId) {
    const metadata = await googleDriveConnector.getFileMetadata(userId, fileId);

    if (metadata.mimeType === GOOGLE_FOLDER_MIME) {
        const listing = await googleDriveConnector.listFiles(userId, {
            filters: { folderId: fileId },
            pageSize: 50
        });
        return {
            metadata,
            text: `Folder "${metadata.name}" contains ${listing.files.length} items:\n` +
                listing.files.map((file) => `- ${file.name} (${file.mimeType})`).join('\n'),
            truncated: false,
            sourceType: 'folder_listing'
        };
    }

    let buffer;
    let effectiveMimeType = metadata.mimeType;

    if (EXPORT_MIME_MAP[metadata.mimeType]) {
        const exported = await googleDriveConnector.exportGoogleFile(
            userId,
            fileId,
            EXPORT_MIME_MAP[metadata.mimeType]
        );
        buffer = exported.buffer;
        effectiveMimeType = exported.exportedMimeType;
    } else {
        const downloaded = await googleDriveConnector.downloadFile(userId, fileId);
        buffer = downloaded.buffer;
    }

    const text = await extractTextFromBuffer(buffer, metadata.name, effectiveMimeType);
    const maxChars = 20000;
    const truncated = text.length > maxChars;

    return {
        metadata,
        text: truncated ? text.slice(0, maxChars) : text,
        truncated,
        sourceType: 'file_content'
    };
}

module.exports = {
    GOOGLE_DOC_MIME,
    GOOGLE_SHEET_MIME,
    GOOGLE_SLIDES_MIME,
    GOOGLE_FOLDER_MIME,
    extractTextFromBuffer,
    readDriveFileContent
};
