/**
 * Semantic PRD chunking — preserves section boundaries before size splitting.
 */

const MAX_SECTION_CHARS = 1800;
const SUBCHUNK_CHARS = 1200;
const MIN_CHUNK_CHARS = 80;

const SECTION_HEADER_PATTERNS = [
    /^#{1,4}\s+(.+)$/,
    /^\d+\.\s+([A-Z][^\n]{2,120})$/,
    /^[A-Z][A-Za-z0-9\s/&\-–—]{3,80}$/
];

function isSectionHeader(line) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length > 120) return null;

    if (/^#{1,4}\s+/.test(trimmed)) {
        return trimmed.replace(/^#{1,4}\s+/, '').trim();
    }
    const numbered = trimmed.match(/^\d+\.\s+(.+)$/);
    if (numbered && /^[A-Z]/.test(numbered[1])) {
        return numbered[1].trim();
    }
    if (
        trimmed.length >= 4 &&
        trimmed.length <= 80 &&
        /^[A-Z]/.test(trimmed) &&
        !trimmed.endsWith('.') &&
        !trimmed.includes('|')
    ) {
        return trimmed;
    }
    return null;
}

function splitLargeSection(sectionName, text) {
    if (text.length <= MAX_SECTION_CHARS) {
        return [{ section: sectionName, text: text.trim() }];
    }

    const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());
    const subchunks = [];
    let buffer = '';

    for (const para of paragraphs) {
        const candidate = buffer ? `${buffer}\n\n${para}` : para;
        if (candidate.length > SUBCHUNK_CHARS && buffer) {
            subchunks.push({ section: sectionName, text: buffer.trim() });
            buffer = para;
        } else {
            buffer = candidate;
        }
    }
    if (buffer.trim()) {
        subchunks.push({ section: sectionName, text: buffer.trim() });
    }

    if (subchunks.length === 0 && text.trim()) {
        let start = 0;
        while (start < text.length) {
            const piece = text.slice(start, start + SUBCHUNK_CHARS).trim();
            if (piece.length >= MIN_CHUNK_CHARS) {
                subchunks.push({ section: sectionName, text: piece });
            }
            start += SUBCHUNK_CHARS;
        }
    }

    return subchunks;
}

/**
 * Split PRD text into semantic chunks with section metadata.
 * @returns {Array<{ section: string, text: string, chunkIndex: number }>}
 */
function chunkPrdText(text) {
    if (!text || !text.trim()) return [];

    const lines = text.split('\n');
    const sections = [];
    let currentSection = 'Document';
    let currentLines = [];

    for (const line of lines) {
        const header = isSectionHeader(line);
        if (header && currentLines.length > 0) {
            sections.push({ section: currentSection, text: currentLines.join('\n').trim() });
            currentLines = [line];
            currentSection = header;
        } else if (header && currentLines.length === 0) {
            currentSection = header;
            currentLines.push(line);
        } else {
            currentLines.push(line);
        }
    }

    if (currentLines.length > 0) {
        sections.push({ section: currentSection, text: currentLines.join('\n').trim() });
    }

    if (sections.length === 0) {
        sections.push({ section: 'Document', text: text.trim() });
    }

    const chunks = [];
    let globalIndex = 0;

    for (const block of sections) {
        if (!block.text || block.text.length < MIN_CHUNK_CHARS) continue;
        const subchunks = splitLargeSection(block.section, block.text);
        for (const sub of subchunks) {
            if (sub.text.length < MIN_CHUNK_CHARS) continue;
            chunks.push({
                section: sub.section,
                text: sub.text,
                chunkIndex: globalIndex
            });
            globalIndex += 1;
        }
    }

    return chunks;
}

module.exports = {
    chunkPrdText,
    MAX_SECTION_CHARS,
    SUBCHUNK_CHARS,
    MIN_CHUNK_CHARS
};
