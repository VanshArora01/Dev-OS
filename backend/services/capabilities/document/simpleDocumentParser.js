const { ensureTwoPageContent } = require('./twoPageLayout');

const MAX_TOTAL_CHARS = 3200;

function truncateText(text, max) {
    const s = String(text || '').trim();
    if (s.length <= max) return s;
    return `${s.slice(0, max - 3)}...`;
}

function parseSimpleContent(title, content, context = {}) {
    const body = truncateText(content, MAX_TOTAL_CHARS);
    return ensureTwoPageContent(title, body, context);
}

function clampStructuredDocument(doc) {
    if (doc.layout?.startsWith('artifact') || doc.template?.startsWith('tech_') || doc.metadata?.artifactType) {
        return doc;
    }
    if (doc.layout === 'two-page-simple' || doc.template === 'two-page-report') {
        return doc;
    }
    const sections = (doc.sections || []).slice(0, 8).map((section) => ({
        ...section,
        paragraphs: (section.paragraphs || []).slice(0, 2).map((p) => truncateText(p, 400)),
        bullets: (section.bullets || []).slice(0, 6).map((b) => truncateText(b, 200)),
        numberedItems: [],
        tables: (section.tables || []).slice(0, 1),
        callouts: []
    }));
    return { ...doc, sections, sources: (doc.sources || []).slice(0, 3) };
}

module.exports = {
    parseSimpleContent,
    clampStructuredDocument,
    MAX_TOTAL_CHARS
};
