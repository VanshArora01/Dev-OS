const { getTemplate } = require('../templates');

function normalizeSection(section = {}) {
    return {
        heading: String(section.heading || '').trim(),
        level: Number(section.level) || 2,
        paragraphs: (section.paragraphs || []).map((p) => String(p).trim()).filter(Boolean),
        bullets: (section.bullets || []).map((b) => String(b).trim()).filter(Boolean),
        numberedItems: (section.numberedItems || []).map((n) => String(n).trim()).filter(Boolean),
        tables: (section.tables || []).map((table) => ({
            headers: (table.headers || []).map((h) => String(h)),
            rows: (table.rows || []).map((row) => (row || []).map((cell) => String(cell)))
        })),
        callouts: (section.callouts || []).map((c) => ({
            type: c.type || 'info',
            title: c.title ? String(c.title) : '',
            content: String(c.content || '').trim()
        })).filter((c) => c.content)
    };
}

function normalizeStructuredDocument(input = {}, context = {}) {
    const templateName = input.template || input.metadata?.template || 'professional-report';
    const template = getTemplate(templateName);

    const metadata = {
        title: String(input.metadata?.title || context.projectName || 'Project Document').trim(),
        subtitle: String(input.metadata?.subtitle || template.subtitle || '').trim(),
        author: String(input.metadata?.author || context.author || 'DevOS Neural AI').trim(),
        organization: String(input.metadata?.organization || context.organization || 'DevOS').trim(),
        date: String(input.metadata?.date || input.metadata?.generatedDate || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })).trim(),
        documentType: String(input.metadata?.documentType || template.documentType).trim(),
        template: input.template || template.name,
        artifactType: input.metadata?.artifactType || input.metadata?.artifact_type || null,
        projectName: input.metadata?.projectName || context.projectName || '',
        generatedDate: input.metadata?.generatedDate || ''
    };

    let sections = (input.sections || []).map((s) => {
        if (s.type === 'divider') return { type: 'divider', heading: '', level: 2 };
        if (s.type === 'metadata') {
            const normalized = normalizeSection(s);
            return { type: 'metadata', heading: '', level: 2, tables: normalized.tables };
        }
        const normalized = normalizeSection(s);
        return normalized;
    }).filter((s) => s.type === 'divider' || s.type === 'metadata' || s.heading || s.paragraphs.length || s.bullets.length || s.tables?.length);

    if (sections.length === 0 && template.sections?.length && !String(input.layout || '').startsWith('artifact')) {
        sections = template.sections.map((heading) => normalizeSection({ heading, level: 2 }));
    }

    const sources = (input.sources || []).map((s) => ({
        title: String(s.title || s.name || 'Source').trim(),
        url: s.url ? String(s.url) : undefined,
        type: s.type ? String(s.type) : undefined
    })).filter((s) => s.title);

    const theme = {
        style: input.theme?.style || 'professional',
        primaryColor: input.theme?.primaryColor,
        accentColor: input.theme?.accentColor,
        fontFamily: input.theme?.fontFamily
    };

    return {
        metadata,
        theme,
        sections,
        sources,
        layout: input.layout || null,
        template: input.template || metadata.template
    };
}

function validateStructuredDocument(doc) {
    if (!doc.metadata?.title) {
        return { valid: false, error: 'Document metadata.title is required' };
    }
    if (!doc.sections?.length) {
        return { valid: false, error: 'Document must include at least one section' };
    }
    const hasContent = doc.sections.some(
        (s) => s.type === 'divider' ||
            s.type === 'metadata' ||
            s.paragraphs?.length ||
            s.bullets?.length ||
            s.numberedItems?.length ||
            s.tables?.length ||
            s.callouts?.length
    );
    if (!hasContent) {
        return { valid: false, error: 'Document sections must include content (paragraphs, bullets, tables, or callouts)' };
    }
    return { valid: true };
}

module.exports = {
    normalizeStructuredDocument,
    normalizeSection,
    validateStructuredDocument
};
