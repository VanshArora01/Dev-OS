const MAX_WORDS = 520;
const MIN_WORDS = 380;

function countWords(text) {
    return String(text || '').trim().split(/\s+/).filter(Boolean).length;
}

function truncateWords(text, maxWords) {
    const words = String(text || '').trim().split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) return words.join(' ');
    return words.slice(0, maxWords).join(' ') + '...';
}

/**
 * Build a compact 2-page professional report structure.
 * Page 1: Executive summary, current stage, implemented, architecture
 * Page 2: In progress, planned, risks, next steps, sources
 */
function buildTwoPageReport(title, content, context = {}) {
    const raw = String(content || '').trim();
    const words = raw.split(/\s+/).filter(Boolean);
    const body = truncateWords(raw, MAX_WORDS);

    const page1Sections = [
        { heading: 'Executive Summary', level: 2, paragraphs: [], bullets: [] },
        { heading: 'Current Project Stage', level: 2, paragraphs: [], bullets: [] },
        { heading: 'Implemented Capabilities', level: 2, paragraphs: [], bullets: [] },
        { heading: 'Current Architecture', level: 2, paragraphs: [], bullets: [], tables: [] }
    ];
    const page2Sections = [
        { heading: 'In Progress', level: 2, paragraphs: [], bullets: [] },
        { heading: 'Planned', level: 2, paragraphs: [], bullets: [] },
        { heading: 'Limitations & Risks', level: 2, paragraphs: [], bullets: [] },
        { heading: 'Next Steps', level: 2, paragraphs: [], bullets: [] }
    ];

    const lines = body.split('\n').map((l) => l.trim()).filter(Boolean);
    let currentBucket = 'summary';
    const buckets = {
        summary: [],
        stage: [],
        implemented: [],
        architecture: [],
        progress: [],
        planned: [],
        risks: [],
        next: []
    };

    for (const line of lines) {
        const lower = line.toLowerCase();
        if (/^#{1,3}\s+/.test(line)) {
            const h = line.replace(/^#{1,3}\s+/, '').toLowerCase();
            if (h.includes('progress') || h.includes('in progress')) currentBucket = 'progress';
            else if (h.includes('planned') || h.includes('roadmap')) currentBucket = 'planned';
            else if (h.includes('risk') || h.includes('limitation')) currentBucket = 'risks';
            else if (h.includes('next') || h.includes('step')) currentBucket = 'next';
            else if (h.includes('implement') || h.includes('capabilit')) currentBucket = 'implemented';
            else if (h.includes('architect')) currentBucket = 'architecture';
            else if (h.includes('stage') || h.includes('status')) currentBucket = 'stage';
            else if (h.includes('executive') || h.includes('summary')) currentBucket = 'summary';
            continue;
        }
        const bullet = line.replace(/^[-*]\s+/, '');
        if (line.startsWith('- ') || line.startsWith('* ')) {
            buckets[currentBucket].push({ type: 'bullet', text: bullet });
        } else {
            buckets[currentBucket].push({ type: 'para', text: line });
        }
    }

    if (buckets.summary.length === 0 && words.length > 0) {
        buckets.summary.push({ type: 'para', text: truncateWords(raw, 80) });
    }

    function fillSection(section, items, maxBullets = 5, maxParas = 2) {
        let bullets = 0;
        let paras = 0;
        for (const item of items) {
            if (item.type === 'bullet' && bullets < maxBullets) {
                section.bullets.push(item.text.slice(0, 200));
                bullets += 1;
            } else if (item.type === 'para' && paras < maxParas) {
                section.paragraphs.push(item.text.slice(0, 400));
                paras += 1;
            }
        }
        if (section.paragraphs.length === 0 && section.bullets.length === 0 && items.length) {
            section.paragraphs.push(items[0].text.slice(0, 400));
        }
    }

    fillSection(page1Sections[0], buckets.summary, 0, 2);
    fillSection(page1Sections[1], buckets.stage);
    fillSection(page1Sections[2], buckets.implemented, 6, 1);
    fillSection(page1Sections[3], buckets.architecture, 4, 1);

    if (page1Sections[3].bullets.length >= 2) {
        page1Sections[3].tables = [{
            headers: ['Component', 'Status'],
            rows: page1Sections[3].bullets.slice(0, 4).map((b) => {
                const parts = b.split(/[:\-–]/);
                return [parts[0]?.trim() || b, parts[1]?.trim() || 'Active'];
            })
        }];
        page1Sections[3].bullets = [];
    }

    fillSection(page2Sections[0], buckets.progress, 5, 1);
    fillSection(page2Sections[1], buckets.planned, 5, 1);
    fillSection(page2Sections[2], buckets.risks, 4, 1);
    fillSection(page2Sections[3], buckets.next, 4, 1);

    page2Sections[0].pageBreakBefore = true;

    const sections = [...page1Sections, ...page2Sections];

    return {
        template: 'two-page-report',
        layout: 'two-page-simple',
        metadata: {
            title: title || context.projectName || 'Project Report',
            subtitle: 'Project Status Report',
            documentType: 'Project Report',
            author: context.author || 'DevOS Neural AI',
            organization: context.organization || context.projectName || 'DevOS',
            date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        },
        sections,
        sources: context.sources || []
    };
}

function ensureTwoPageContent(title, content, context = {}) {
    const wordCount = countWords(content);
    if (wordCount < MIN_WORDS && content) {
        content = `${content}\n\nThis report summarizes the current project status based on available project context, recent activity, and implementation evidence. Content is grounded in known project data and distinguishes implemented capabilities from planned work.`;
    }
    return buildTwoPageReport(title, content, context);
}

module.exports = {
    buildTwoPageReport,
    ensureTwoPageContent,
    MAX_WORDS,
    MIN_WORDS
};
