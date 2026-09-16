const { ARTIFACT_TYPES, ARTIFACT_TYPE_LABELS } = require('./artifactTypes');
const { formatDate } = require('./projectContextExtractor');

const CATEGORY_ORDER = [
    'Frontend',
    'Backend',
    'Database',
    'Authentication',
    'Integration',
    'DevOps',
    'Testing',
    'Tooling',
    'Other'
];

const TECH_CATEGORY_PATTERNS = [
    { category: 'Frontend', pattern: /\b(react|vue|angular|svelte|next\.?js|tailwind|typescript|javascript|html|css|vite|webpack|redux)\b/i },
    { category: 'Backend', pattern: /\b(node\.?js|express|fastify|nest|django|flask|spring|ruby|php|laravel|api)\b/i },
    { category: 'Database', pattern: /\b(postgres|postgresql|mongo|mysql|sqlite|redis|prisma|dynamodb|qdrant)\b/i },
    { category: 'Authentication', pattern: /\b(jwt|bcrypt|oauth|clerk|passport|auth|session)\b/i },
    { category: 'Integration', pattern: /\b(google\s*drive|github|stripe|slack|gmail|oauth|gemini|groq)\b/i },
    { category: 'DevOps', pattern: /\b(docker|kubernetes|aws|azure|gcp|ci\/cd|github\s*actions|electron)\b/i },
    { category: 'Testing', pattern: /\b(jest|mocha|cypress|playwright|vitest|testing)\b/i }
];

function normalizeCategory(cat) {
    const c = String(cat || '').trim();
    if (!c) return 'Other';
    const lower = c.toLowerCase();
    for (const name of CATEGORY_ORDER) {
        if (lower === name.toLowerCase()) return name;
    }
    if (/front/i.test(c)) return 'Frontend';
    if (/back/i.test(c)) return 'Backend';
    if (/data|db/i.test(c)) return 'Database';
    if (/auth/i.test(c)) return 'Authentication';
    if (/integrat/i.test(c)) return 'Integration';
    return c.charAt(0).toUpperCase() + c.slice(1);
}

function inferCategory(name) {
    for (const rule of TECH_CATEGORY_PATTERNS) {
        if (rule.pattern.test(name)) return rule.category;
    }
    return 'Other';
}

function purposeFromItem(item) {
    const source = String(item.source || '').trim();
    if (source && source.toLowerCase() !== 'specified' && source.length > 2) {
        return source.slice(0, 80);
    }
    const cat = normalizeCategory(item.category);
    const purposes = {
        Frontend: 'User interface layer',
        Backend: 'Server / API layer',
        Database: 'Data persistence',
        Authentication: 'Identity and access',
        Integration: 'External service integration',
        DevOps: 'Build and deployment',
        Testing: 'Quality assurance',
        Tooling: 'Development tooling'
    };
    return purposes[cat] || 'Project technology';
}

function buildTechEntries(ctx) {
    const map = new Map();

    const add = (name, category, source) => {
        const key = String(name).trim();
        if (!key) return;
        const cat = normalizeCategory(category || inferCategory(key));
        if (!map.has(key)) {
            map.set(key, { name: key, category: cat, source: source || '' });
        }
    };

    for (const t of ctx.techDetails) {
        add(t.name, t.category, t.source);
    }
    for (const name of ctx.techFlat) add(name, inferCategory(name), '');
    for (const name of ctx.blueprintTech) add(name, inferCategory(name), 'PRD');

    const grouped = {};
    for (const item of map.values()) {
        const cat = item.category;
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push([item.name, purposeFromItem(item)]);
    }

    return grouped;
}

function buildArchitectureSummary(grouped) {
    const parts = [];
    if (grouped.Frontend?.length) parts.push('Frontend');
    if (grouped.Backend?.length) parts.push('REST API');
    if (grouped.Backend?.length) parts.push('Backend');
    if (grouped.Database?.length) parts.push(grouped.Database[0][0]);
    if (parts.length < 2) return null;
    return parts.join(' → ');
}

function dividerSection() {
    return { type: 'divider', heading: '', level: 2 };
}

function metadataSection(ctx, lines = []) {
    const rows = [
        ['Project', ctx.projectName],
        ['Generated', ctx.generatedDate],
        ...lines
    ];
    return {
        type: 'metadata',
        heading: '',
        level: 2,
        tables: [{ headers: ['', ''], rows }]
    };
}

function bulletSection(heading, items, level = 2) {
    return {
        heading,
        level,
        bullets: items.length ? items : ['None recorded']
    };
}

function tableSection(heading, headers, rows, level = 2) {
    return {
        heading,
        level,
        tables: [{ headers, rows: rows.length ? rows : [['—', '—']] }]
    };
}

function buildTechStackArtifact(ctx, options = {}) {
    const grouped = buildTechEntries(ctx);
    const title = options.title || ctx.projectName;
    const sections = [
        metadataSection(ctx)
    ];

    const orderedCats = [
        ...CATEGORY_ORDER.filter((c) => grouped[c]?.length),
        ...Object.keys(grouped).filter((c) => !CATEGORY_ORDER.includes(c))
    ];

    for (const cat of orderedCats) {
        sections.push(dividerSection());
        sections.push(tableSection(
            cat.toUpperCase(),
            ['Technology', 'Purpose'],
            grouped[cat]
        ));
    }

    const arch = buildArchitectureSummary(grouped);
    if (arch) {
        sections.push(dividerSection());
        sections.push({
            heading: 'Architecture Summary',
            level: 2,
            paragraphs: [arch]
        });
    }

    return wrapArtifact(ARTIFACT_TYPES.TECH_STACK, {
        title,
        subtitle: 'Technology Stack',
        documentType: ARTIFACT_TYPE_LABELS.tech_stack
    }, sections, buildSources(ctx));
}

function buildProjectReportArtifact(ctx, options = {}) {
    const title = options.title || ctx.projectName;
    const progress = ctx.milestones.length
        ? `${ctx.completed.length} completed · ${ctx.inProgress.length} in progress · ${ctx.pending.length} pending`
        : 'No milestones tracked';

    const sections = [
        {
            heading: 'Executive Summary',
            level: 2,
            paragraphs: [
                ctx.blueprintObjective
                    ? ctx.blueprintObjective.slice(0, 500)
                    : (ctx.description || 'Project status report generated from current project data.').slice(0, 500)
            ]
        },
        tableSection('Project Status', ['Field', 'Value'], [
            ['Current phase', ctx.currentPhase || 'Not set'],
            ['Overall status', ctx.status],
            ['Priority', ctx.priority || '—'],
            ['Progress', progress]
        ]),
        bulletSection('Completed', ctx.completed.map((m) => m.title)),
        bulletSection('In Progress', ctx.inProgress.map((m) => m.title)),
        bulletSection('Blockers', ctx.reminders.filter((r) => r.message?.toLowerCase().includes('block'))
            .map((r) => r.message).concat(
                ctx.pending.filter((m) => m.priority === 'critical').map((m) => `Pending critical: ${m.title}`)
            )),
        {
            heading: 'Next Steps',
            level: 2,
            numberedItems: [
                ctx.nextPlannedStep || 'Continue current milestone work',
                ...ctx.inProgress.slice(0, 2).map((m) => m.title)
            ].filter(Boolean).slice(0, 5)
        }
    ];

    const grouped = buildTechEntries(ctx);
    const techRows = [];
    for (const cat of CATEGORY_ORDER) {
        if (!grouped[cat]) continue;
        for (const [name, purpose] of grouped[cat]) {
            techRows.push([cat, name, purpose]);
        }
    }
    if (techRows.length) {
        sections.push(tableSection('Tech Stack', ['Layer', 'Technology', 'Purpose'], techRows));
    }

    const activityRows = [];
    if (ctx.lastSessionSummary) {
        activityRows.push(['Recent session', ctx.lastSessionSummary.slice(0, 120)]);
    }
    for (const s of (ctx.recentSessions || []).slice(0, 5)) {
        const when = s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—';
        activityRows.push([when, (s.summary || '').slice(0, 120)]);
    }
    sections.push(tableSection('Recent Activity', ['Date', 'Summary'], activityRows));

    const deadlineRows = ctx.deadlines.slice(0, 8).map((d) => [d.title, d.date || '—', d.source || '—']);
    sections.push(tableSection('Deadlines', ['Item', 'Date', 'Source'], deadlineRows));

    return wrapArtifact(ARTIFACT_TYPES.PROJECT_REPORT, {
        title,
        subtitle: 'Project Report',
        documentType: ARTIFACT_TYPE_LABELS.project_report
    }, sections, buildSources(ctx), 'artifact-report');
}

function buildStatusUpdateArtifact(ctx, options = {}) {
    const title = options.title || ctx.projectName;
    const sections = [
        tableSection('Overview', ['Field', 'Value'], [
            ['Project', ctx.projectName],
            ['Date', ctx.generatedDate],
            ['Overall status', ctx.status],
            ['Current phase', ctx.currentPhase || '—']
        ]),
        bulletSection('Completed', ctx.completed.slice(0, 8).map((m) => m.title)),
        bulletSection('In Progress', ctx.inProgress.slice(0, 6).map((m) => m.title)),
        bulletSection('Blockers', ctx.reminders.slice(0, 4).map((r) => r.message).filter(Boolean)),
        bulletSection('Upcoming', ctx.pending.slice(0, 6).map((m) => m.title)),
        tableSection('Deadlines', ['Item', 'Date'], ctx.deadlines.slice(0, 5).map((d) => [d.title, d.date || '—'])),
        {
            heading: 'Key Notes',
            level: 2,
            paragraphs: [ctx.lastSessionSummary || 'No recent session notes recorded.'].slice(0, 300)
        },
        {
            heading: 'Next Action',
            level: 2,
            paragraphs: [ctx.nextPlannedStep || 'Continue planned milestone work.']
        }
    ];

    return wrapArtifact(ARTIFACT_TYPES.STATUS_UPDATE, {
        title,
        subtitle: 'Status Update',
        documentType: ARTIFACT_TYPE_LABELS.status_update
    }, sections, buildSources(ctx), 'artifact-concise');
}

function buildStandupArtifact(ctx, options = {}) {
    const sections = [
        tableSection('Standup', ['Field', 'Value'], [
            ['Project', ctx.projectName],
            ['Week', ctx.generatedDate]
        ]),
        bulletSection('Completed', ctx.completed.slice(0, 6).map((m) => m.title)),
        bulletSection('Blockers', ctx.reminders.slice(0, 4).map((r) => r.message).filter(Boolean)),
        bulletSection('Decisions', ctx.decisions.slice(0, 4).map((d) => `${d.title}: ${(d.reasoning || '').slice(0, 80)}`)),
        bulletSection('Next Week', [
            ctx.nextPlannedStep,
            ...ctx.inProgress.slice(0, 4).map((m) => m.title)
        ].filter(Boolean)),
        bulletSection('Risks', ctx.pending.filter((m) => m.priority === 'critical' || m.priority === 'high')
            .map((m) => `${m.title} (${m.priority})`))
    ];

    return wrapArtifact(ARTIFACT_TYPES.STANDUP, {
        title: options.title || ctx.projectName,
        subtitle: 'Weekly Standup',
        documentType: ARTIFACT_TYPE_LABELS.standup
    }, sections, buildSources(ctx), 'artifact-concise');
}

function buildProjectSummaryArtifact(ctx, options = {}) {
    const sections = [
        {
            heading: 'Project Overview',
            level: 2,
            paragraphs: [(ctx.description || ctx.blueprintObjective || 'No overview available.').slice(0, 400)]
        },
        {
            heading: 'Objective',
            level: 2,
            paragraphs: [ctx.blueprintObjective || 'Not specified in project data.'].slice(0, 300)
        },
        {
            heading: 'Target Users',
            level: 2,
            paragraphs: [ctx.blueprintTargetUsers || 'Not specified.'].slice(0, 200)
        },
        {
            heading: 'Scope',
            level: 2,
            paragraphs: [ctx.blueprintScope || 'Not specified.'].slice(0, 300)
        },
        {
            heading: 'Core Features',
            level: 2,
            bullets: ctx.requirements.slice(0, 8).map((r) => r.title).filter(Boolean)
        },
        tableSection('Technology', ['Category', 'Technologies'], Object.entries(buildTechEntries(ctx))
            .map(([cat, rows]) => [cat, rows.map((r) => r[0]).join(', ')])),
        tableSection('Current Status', ['Field', 'Value'], [
            ['Status', ctx.status],
            ['Phase', ctx.currentPhase || '—'],
            ['Next step', ctx.nextPlannedStep || '—']
        ])
    ];

    return wrapArtifact(ARTIFACT_TYPES.PROJECT_SUMMARY, {
        title: options.title || ctx.projectName,
        subtitle: 'Project Summary',
        documentType: ARTIFACT_TYPE_LABELS.project_summary
    }, sections, buildSources(ctx), 'artifact-concise');
}

function buildRequirementsArtifact(ctx, options = {}) {
    const reqRows = ctx.requirements.slice(0, 20).map((r, i) => [
        r.id || `FR-${String(i + 1).padStart(2, '0')}`,
        r.title || '—',
        r.priority || 'medium',
        r.status || 'specified'
    ]);

    const sections = [
        tableSection('Requirements Overview', ['ID', 'Requirement', 'Priority', 'Status'], reqRows),
        {
            heading: 'Functional Requirements',
            level: 2,
            bullets: ctx.requirements.filter((r) => !/technical|constraint/i.test(r.title || ''))
                .slice(0, 12).map((r) => r.title)
        },
        {
            heading: 'Technical Requirements',
            level: 2,
            bullets: Object.values(buildTechEntries(ctx)).flat().map((r) => r[0])
        },
        {
            heading: 'Constraints',
            level: 2,
            bullets: ctx.blueprintScope ? [`Scope: ${ctx.blueprintScope.slice(0, 200)}`] : ['Not specified in PRD.']
        },
        {
            heading: 'Assumptions',
            level: 2,
            bullets: ctx.prdIndexed ? ['Requirements sourced from indexed PRD.'] : ['PRD not indexed — requirements may be incomplete.']
        }
    ];

    return wrapArtifact(ARTIFACT_TYPES.REQUIREMENTS, {
        title: options.title || ctx.projectName,
        subtitle: 'Project Requirements',
        documentType: ARTIFACT_TYPE_LABELS.requirements
    }, sections, buildSources(ctx));
}

function buildMeetingSummaryArtifact(ctx, options = {}) {
    const sections = [
        tableSection('Meeting Summary', ['Field', 'Value'], [
            ['Date', ctx.generatedDate],
            ['Project', ctx.projectName]
        ]),
        {
            heading: 'Discussion',
            level: 2,
            paragraphs: [ctx.lastSessionSummary || 'No discussion notes recorded.'].slice(0, 400)
        },
        bulletSection('Decisions', ctx.decisions.slice(0, 6).map((d) => d.title)),
        tableSection('Action Items', ['Action', 'Owner', 'Due Date'], ctx.inProgress.slice(0, 6).map((m) => [
            m.title,
            '—',
            m.dueDate ? new Date(m.dueDate).toLocaleDateString() : '—'
        ])),
        {
            heading: 'Follow-up',
            level: 2,
            paragraphs: [ctx.nextPlannedStep || 'Continue planned work items.']
        }
    ];

    return wrapArtifact(ARTIFACT_TYPES.MEETING_SUMMARY, {
        title: options.title || ctx.projectName,
        subtitle: 'Meeting Summary',
        documentType: ARTIFACT_TYPE_LABELS.meeting_summary
    }, sections, buildSources(ctx), 'artifact-concise');
}

function buildGenericArtifact(ctx, options = {}) {
    const content = String(options.content || '').trim();
    const sections = [];

    if (content) {
        const lines = content.split('\n').map((l) => l.trim()).filter(Boolean);
        let current = { heading: 'Content', level: 2, bullets: [], paragraphs: [] };
        for (const line of lines) {
            if (line.startsWith('## ')) {
                if (current.bullets.length || current.paragraphs.length) sections.push(current);
                current = { heading: line.slice(3), level: 2, bullets: [], paragraphs: [] };
            } else if (line.startsWith('- ') || line.startsWith('* ')) {
                current.bullets.push(line.slice(2));
            } else if (line.length < 120 && !line.includes('.')) {
                current.bullets.push(line);
            } else {
                current.paragraphs.push(line);
            }
        }
        if (current.bullets.length || current.paragraphs.length) sections.push(current);
    }

    if (!sections.length) {
        sections.push({
            heading: 'Summary',
            level: 2,
            paragraphs: [(ctx.description || 'Document generated from project context.').slice(0, 500)]
        });
    }

    return wrapArtifact(ARTIFACT_TYPES.GENERIC, {
        title: options.title || ctx.projectName,
        subtitle: options.subtitle || 'Document',
        documentType: ARTIFACT_TYPE_LABELS.generic
    }, sections, buildSources(ctx));
}

function buildSources(ctx) {
    const sources = [{ title: 'Project data', type: 'Project' }];
    if (ctx.prdIndexed) sources.push({ title: ctx.prdFilename || 'Project PRD', type: 'PRD' });
    if (ctx.githubRepos.length) sources.push({ title: ctx.githubRepos.join(', '), type: 'GitHub' });
    if (ctx.lastSessionSummary) sources.push({ title: 'Recent session', type: 'Session' });
    return sources.slice(0, 5);
}

function wrapArtifact(artifactType, meta, sections, sources, layout = 'artifact') {
    return {
        layout,
        template: artifactType,
        metadata: {
            ...meta,
            artifactType,
            projectName: meta.title,
            generatedDate: formatDate()
        },
        sections,
        sources
    };
}

function buildArtifact(artifactType, ctx, options = {}) {
    switch (artifactType) {
        case ARTIFACT_TYPES.TECH_STACK:
            return buildTechStackArtifact(ctx, options);
        case ARTIFACT_TYPES.PROJECT_REPORT:
            return buildProjectReportArtifact(ctx, options);
        case ARTIFACT_TYPES.STATUS_UPDATE:
            return buildStatusUpdateArtifact(ctx, options);
        case ARTIFACT_TYPES.STANDUP:
            return buildStandupArtifact(ctx, options);
        case ARTIFACT_TYPES.PROJECT_SUMMARY:
            return buildProjectSummaryArtifact(ctx, options);
        case ARTIFACT_TYPES.REQUIREMENTS:
            return buildRequirementsArtifact(ctx, options);
        case ARTIFACT_TYPES.MEETING_SUMMARY:
            return buildMeetingSummaryArtifact(ctx, options);
        case ARTIFACT_TYPES.GENERIC:
        default:
            return buildGenericArtifact(ctx, options);
    }
}

module.exports = {
    buildArtifact,
    buildTechStackArtifact,
    buildTechEntries
};
