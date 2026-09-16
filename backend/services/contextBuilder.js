const RECENT_MESSAGES_FOR_AGENT = 5;
const SUMMARY_SECTION_HEADER = 'CONVERSATION SUMMARY:';

function buildBlueprintContext(project) {
    const bp = project.blueprint;
    if (!bp) return '';

    const lines = ['PROJECT BLUEPRINT (from PRD initialization):'];

    if (bp.project) {
        lines.push(`Objective: ${(bp.project.objective || '').slice(0, 300)}`);
        lines.push(`Target Users: ${(bp.project.targetUsers || 'not specified').slice(0, 200)}`);
        lines.push(`Scope: ${(bp.project.scope || 'not specified').slice(0, 200)}`);
    }

    const phases = (bp.phases || []).slice(0, 8);
    if (phases.length) {
        lines.push(`Phases: ${phases.map((p) => p.name).join(' → ')}`);
    }

    const reqs = (bp.requirements || []).slice(0, 10);
    if (reqs.length) {
        lines.push('Key Requirements:');
        reqs.forEach((r) => lines.push(`  - [${r.priority}] ${r.title} (Source: ${r.source})`));
    }

    const tech = (project.techStackDetails || bp.techStack || []).slice(0, 12);
    if (tech.length) {
        const techStr = tech.map((t) =>
            typeof t === 'string' ? t : `${t.name} [${t.source || 'specified'}]`
        ).join(', ');
        lines.push(`Tech Stack: ${techStr}`);
    }

    const deadlines = (bp.deadlines || []).slice(0, 5);
    if (deadlines.length) {
        lines.push('PRD Deadlines:');
        deadlines.forEach((d) => lines.push(`  - ${d.title}: ${d.date} (${d.confidence}) Source: ${d.source}`));
    }

    if (project.currentPhase) {
        lines.push(`Current Phase: ${project.currentPhase}`);
    }

    if (project.unresolvedDeadlines?.length) {
        lines.push(`Unresolved dates needing review: ${project.unresolvedDeadlines.map((d) => d.title).join(', ')}`);
    }

    if (project.prdIndexing?.status === 'indexed') {
        lines.push(`PRD knowledge indexed (${project.prdIndexing.chunkCount || 0} chunks) — use search_project_knowledge for detailed PRD questions.`);
    }

    const githubRepos = project.githubRepositories || [];
    if (githubRepos.length) {
        lines.push(`GitHub repositories: ${githubRepos.map((r) => r.fullName).join(', ')}`);
        lines.push('Use GitHub tools for repository-specific questions. Do not guess about code, commits, or PRs.');
    }

    return lines.join('\n');
}

function buildCompactProjectContext(project, recentSessions) {
    const sessions = recentSessions.slice(0, 3).map((s) =>
        `${s.createdAt.toDateString()}: ${(s.summary || '').slice(0, 150)}`
    ).join('; ') || 'None';

    const milestones = (project.planning?.milestones || [])
        .slice(0, 8)
        .map((m) => `${(m.title || '').slice(0, 60)} [${m.status}]${m.phase ? ` (${m.phase})` : ''}`)
        .join(', ') || 'None';

    const blueprintBlock = buildBlueprintContext(project);

    return `Project: ${project.name} | Status: ${project.status}
Description: ${(project.description || 'None').slice(0, 200)}
Tech: ${(project.techStack || []).slice(0, 8).join(', ') || 'None'}
Next: ${project.nextPlannedStep || 'None'}
Current Phase: ${project.currentPhase || 'Not set'}
Recent sessions: ${sessions}
Tasks/Milestones: ${milestones}
${blueprintBlock}`;
}

function buildArtifactSection(currentArtifact) {
    if (!currentArtifact?.artifact_id) return '';
    return `CURRENT DOCUMENT ARTIFACT (reuse for upload/email — do not regenerate):
- file: ${currentArtifact.file_name}
- format: ${currentArtifact.format || 'document'}
- artifact_id: ${currentArtifact.artifact_id}
- download: ${currentArtifact.download_url || 'available after generation'}

When user says "save it", "upload it", or "email it", reuse this artifact_id.`;
}

function buildGithubScopeSection(githubContext) {
    if (!githubContext) return '';
    const lines = ['GITHUB CONVERSATION SCOPE:'];
    if (githubContext.owner && githubContext.repo) {
        lines.push(`Repository: ${githubContext.owner}/${githubContext.repo}`);
    }
    if (githubContext.branch) lines.push(`Branch: ${githubContext.branch}`);
    if (githubContext.path) lines.push(`Selected path: ${githubContext.path}`);
    if (githubContext.type === 'file') {
        lines.push('This conversation is scoped to the selected file. Retrieve that file before explaining it.');
    } else if (githubContext.type === 'folder') {
        lines.push('This conversation concerns the selected folder/module. List files first, then retrieve only the files needed.');
    } else {
        lines.push('This conversation concerns the linked repository. Use repository structure and targeted file reads.');
    }
    return lines.join('\n');
}

function buildCapabilityRules(capabilities = [], extras = {}) {
    const caps = new Set(capabilities || []);
    const lines = [];

    if (caps.has('email')) {
        lines.push('EMAIL WORKFLOW (required order):');
        lines.push('1. Gather content from compact project context (tech stack, sessions, PRD) or prior tool results.');
        lines.push('2. If no CURRENT DOCUMENT ARTIFACT exists, call generate_docx OR generate_pdf with artifact_type (e.g. tech_stack) and output_name.');
        lines.push('3. Copy the exact artifact_id (art_...) from the generation tool result — never use topic names or filenames.');
        lines.push('4. Call send_document_email with that artifact_id, recipient_email, subject, greeting, message, signoff, sender_name.');
        lines.push('5. Do not claim email was sent until send_document_email succeeds after user approval.');
        lines.push('Tool name is send_document_email (not send_email).');
    }

    if (caps.has('document') && !caps.has('email')) {
        lines.push('DOCUMENT: Call generate_docx or generate_pdf with artifact_type (tech_stack, project_report, status_update, project_summary, requirements, standup, meeting_summary, generic) and output_name. The system builds structured tables/sections from project data — do not write prose content into the tool call.');
    }

    if (caps.has('github') && extras.githubConnected) {
        lines.push('GITHUB: Use github_* tools for commits, PRs, files, and code explanations. Cite paths.');
    } else if (!caps.has('github')) {
        lines.push('PROJECT CONTEXT: Tech stack, milestones, and PRD facts are in the compact project block below — answer from there without GitHub tools.');
    }

    return lines.length ? lines.join('\n') : '';
}

function buildSystemPrompt(project, recentSessions, driveConnected, conversationSummary = '', profile = 'full', currentArtifact = null, extras = {}) {
    const { githubConnected = false, githubContext = null, capabilities = [] } = extras;
    const caps = new Set(capabilities);
    const summarySection = conversationSummary
        ? `${SUMMARY_SECTION_HEADER} ${conversationSummary.slice(0, 400)}\n`
        : '';
    const artifactSection = buildArtifactSection(currentArtifact);
    const projectBlock = buildCompactProjectContext(project, recentSessions);
    const capabilityRules = buildCapabilityRules(capabilities, extras);

    const integrationRule = (!driveConnected || (!caps.has('github') && extras.githubConnected === false))
        ? '- If an integration (Drive/GitHub) is not connected and the user asks to use it, tell them to connect it from Settings first. NEVER ask for raw tokens.'
        : '';

    if (profile === 'chat' && caps.size <= 1) {
        return {
            role: 'system',
            content: `You are Neural AI for project "${project.name}". Answer concisely from context. Do not generate files unless explicitly asked.

${projectBlock}
${summarySection}
${artifactSection}
Rules:
- No file generation for normal questions.
- Understand "that/this/it" from conversation.
${integrationRule}
- For planning, status, tech stack, and milestone questions, use the compact project context directly. Do NOT use search_project_knowledge unless you need specific, deep PRD facts that are not present in the compact project context.
- Call search_project_knowledge at most once. If it returns nothing useful, answer immediately from the compact project context — do not search again.
Today: ${new Date().toISOString().split('T')[0]}.`
        };
    }

    const driveNote = driveConnected
        ? 'Drive connected. Search before creating folders. Verify uploads with drive_get_file.'
        : 'Drive not connected.';
    const githubNote = caps.has('github') && githubConnected
        ? 'GitHub connected. For code, commits, PRs, and files: use github_search_code / github_list_files / github_get_file. Always use full paths with extensions (.ts/.tsx/.js). Cite GitHub → path. Never invent repository facts.'
        : caps.has('github')
            ? 'GitHub not connected — cannot use repository tools.'
            : 'Use compact project context for tech stack and planning questions (no GitHub tools in this session).';
    const githubScope = caps.has('github') ? buildGithubScopeSection(githubContext) : '';

    const docNote = (profile === 'document' || caps.has('document'))
        ? 'Documents: use generate_docx/generate_pdf with artifact_type + output_name. Structured layout is rendered automatically from project data.'
        : '';

    return {
        role: 'system',
        content: `You are Neural AI for project "${project.name}". Complete multi-step tasks yourself.

${projectBlock}
${summarySection}
${artifactSection}
${driveNote}
${githubNote}
${githubScope}
${docNote}
${capabilityRules}

Rules:
- Understand "that/this/it/the report" from prior messages — do not ask user to repeat.
${integrationRule}
- For planning, status, tech stack, and milestone questions, use the compact project context directly. Do NOT use search_project_knowledge unless you need specific, deep PRD facts that are not present in the compact project context.
- Generate only the requested format (DOCX or PDF, not both).
- After generation, tell user download is available with markdown link using download_url from tool result.
- Reuse current artifact for Drive upload and email; never regenerate unless user changes content/format.
- After drive_upload_file, verify with drive_get_file before claiming success.
- GitHub answers require retrieved evidence. If a relationship is inferred, label it inferred.
- Never fetch a path without a file extension. If a path 404s, try .tsx/.ts/.js/.jsx or list the parent folder.
- After two knowledge searches, stop searching and write the answer.
- Use only tools available in this session.
Today: ${new Date().toISOString().split('T')[0]}.`
    };
}

function formatMessagesForAgent(recentMessages) {
    return recentMessages.map((msg) => {
        if (msg.role === 'user') {
            return { role: 'user', content: msg.content };
        }
        if (msg.role === 'assistant') {
            return { role: 'assistant', content: msg.content || '' };
        }
        return { role: msg.role, content: msg.content || '' };
    });
}

function buildAgentMessages(recentMessages) {
    const bounded = recentMessages.slice(-RECENT_MESSAGES_FOR_AGENT);
    return formatMessagesForAgent(bounded);
}

function buildWorkspaceCompactContext(projects, recentSessions) {
    const now = Date.now();
    const lines = ['WORKSPACE PORTFOLIO (all projects — use this for cross-project questions):'];

    (projects || []).slice(0, 24).forEach((p) => {
        const milestones = p.planning?.milestones || [];
        const done = milestones.filter((m) => m.status === 'completed').length;
        const inProgress = milestones.filter((m) => m.status === 'in-progress').length;
        const reminders = p.reminders || [];
        const openReminders = reminders.filter((r) => !r.sent);
        const overdueReminders = openReminders.filter((r) => r.date && new Date(r.date).getTime() < now);
        const lastWorked = p.lastWorkedAt ? new Date(p.lastWorkedAt).toISOString().split('T')[0] : 'never';
        const deadline = p.deadline ? new Date(p.deadline).toISOString().split('T')[0] : 'none';
        const idleDays = p.lastWorkedAt
            ? Math.floor((now - new Date(p.lastWorkedAt).getTime()) / 86400000)
            : 'n/a';
        lines.push(
            `- ${p.name} | status=${p.status} | type=${p.type || 'n/a'} | priority=${p.priority || 'n/a'} | deadline=${deadline} | lastWorked=${lastWorked} (${idleDays}d idle) | next=${(p.nextPlannedStep || 'none').slice(0, 120)} | kanban=${done} done / ${inProgress} in-progress / ${milestones.length} total | reminders open=${openReminders.length} overdue=${overdueReminders.length} | last session: ${(p.lastSessionSummary || 'none').slice(0, 140)}`
        );
    });

    const sessionLines = (recentSessions || []).slice(0, 12).map((s) => {
        const name = s.projectId?.name || s.projectName || 'Unknown project';
        const when = s.createdAt ? new Date(s.createdAt).toDateString() : 'unknown date';
        return `  ${when} [${name}]: ${(s.summary || '').slice(0, 160)}`;
    });
    lines.push('Recent session activity:');
    lines.push(sessionLines.length ? sessionLines.join('\n') : '  None');
    return lines.join('\n');
}

function buildWorkspaceSystemPrompt(workspace, driveConnected, conversationSummary = '', profile = 'full', extras = {}) {
    const { githubConnected = false } = extras;
    const summarySection = conversationSummary
        ? `${SUMMARY_SECTION_HEADER} ${conversationSummary.slice(0, 400)}\n`
        : '';
    const portfolio = buildWorkspaceCompactContext(workspace.projects, workspace.recentSessions);
    const driveNote = driveConnected ? 'Drive connected.' : 'Drive not connected.';
    const githubNote = githubConnected ? 'GitHub connected for linked repos.' : 'GitHub not connected.';

    return {
        role: 'system',
        content: `You are Neural AI for the user's entire DevOS workspace (not a single project). Answer portfolio-level questions such as what to focus on today, which project is most important, what is overdue, and where recent effort went. Use the portfolio facts below — do not invent projects or deadlines.

${portfolio}
${summarySection}
${driveNote}
${githubNote}

Rules:
- Compare projects using status, priority, deadlines, idle time, kanban progress, reminders, and recent sessions.
- If a tool requires a specific project, ask which one or pick the clearly matching project by name from the portfolio.
- Understand "that/this/it" from conversation history.
- Prefer the portfolio facts over extra tool searches. Search at most once.
Today: ${new Date().toISOString().split('T')[0]}.`
    };
}

function buildProjectContext(project, recentSessions) {
    return buildCompactProjectContext(project, recentSessions);
}

function buildDriveSection(driveConnected) {
    return driveConnected ? 'Google Drive connected.' : 'Google Drive not connected.';
}

module.exports = {
    RECENT_MESSAGES_FOR_AGENT,
    buildSystemPrompt,
    buildWorkspaceSystemPrompt,
    buildWorkspaceCompactContext,
    buildAgentMessages,
    buildProjectContext,
    buildDriveSection
};
