const { extractTextFromBuffer } = require('../documentParser');

const MIN_TEXT_LENGTH = 50;
const MAX_TEXT_LENGTH = 80000;

/**
 * Normalize extracted PRD text while preserving structure.
 */
function normalizePrdText(raw) {
    if (!raw || typeof raw !== 'string') return '';

    let text = raw
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\u0000/g, '')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{4,}/g, '\n\n\n')
        .trim();

    if (text.length > MAX_TEXT_LENGTH) {
        text = text.slice(0, MAX_TEXT_LENGTH) + '\n\n[Document truncated for processing]';
    }

    return text;
}

async function extractPrdFromFile(file) {
    if (!file || !file.buffer) {
        throw new Error('File upload failed — no buffer received');
    }

    const fileName = (file.originalname || '').toLowerCase();
    const mimeType = file.mimetype || '';

    const allowed = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown'
    ];
    const allowedExt = ['.pdf', '.docx', '.txt', '.md'];

    const hasAllowedMime = allowed.includes(mimeType);
    const hasAllowedExt = allowedExt.some((ext) => fileName.endsWith(ext));

    if (!hasAllowedMime && !hasAllowedExt) {
        throw new Error('Unsupported file format. Please upload PDF, DOCX, TXT, or MD.');
    }

    const extracted = await extractTextFromBuffer(file.buffer, file.originalname, mimeType);
    const text = normalizePrdText(extracted);

    if (!text || text.length < MIN_TEXT_LENGTH) {
        throw new Error(
            `Document does not contain enough readable text (minimum ${MIN_TEXT_LENGTH} characters). It may be scanned, empty, or corrupted.`
        );
    }

    return {
        text,
        filename: file.originalname || 'uploaded-document',
        charCount: text.length
    };
}

function extractPrdFromText(bodyText) {
    const text = normalizePrdText(bodyText);

    if (!text || text.length < MIN_TEXT_LENGTH) {
        throw new Error(
            `PRD text is too short for analysis (minimum ${MIN_TEXT_LENGTH} characters).`
        );
    }

    return {
        text,
        filename: 'pasted-text',
        charCount: text.length
    };
}

module.exports = {
    MIN_TEXT_LENGTH,
    MAX_TEXT_LENGTH,
    normalizePrdText,
    extractPrdFromFile,
    extractPrdFromText
};
