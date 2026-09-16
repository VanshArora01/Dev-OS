const { config } = require('../config/ai');
const { safeGroqCompletion } = require('./groqClient');
const ROUTING_MODEL = config.intentModel;

const CAPABILITIES = {
    KNOWLEDGE: 'knowledge',
    DRIVE_READ: 'drive_read',
    DRIVE_WRITE: 'drive_write',
    GITHUB: 'github',
    DOCUMENT: 'document',
    EMAIL: 'email',
    PROJECT_ACTION: 'project_action'
};

const VALID_PROFILES = new Set(['chat', 'drive_read', 'github_read', 'document', 'project_action', 'full']);

const EMAIL_ADDRESS_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

function isFollowUpDocumentAction(message, currentArtifact) {
    if (!currentArtifact?.artifact_id) return false;
    const m = String(message || '').toLowerCase().trim();
    if (m.length > 120) return false;
    const patterns = [
        'save it', 'upload it', 'save to drive', 'upload to drive', 'email it', 'email this',
        'send it', 'send this', 'to drive', 'to my drive', 'make a pdf', 'pdf version',
        'make that a docx', 'make that a pdf', 'turn that into', 'turn this into'
    ];
    return patterns.some((p) => m.includes(p));
}

function detectsEmailAction(snippet) {
    const s = String(snippet || '');
    if (EMAIL_ADDRESS_RE.test(s)) return true;
    if (/\b(email|e-mail|mail)\s+(me|it|this|that|us)\b/i.test(s)) return true;
    return /\b(email|e-mail|mail)\b/i.test(s) && /\b(to|send|attach|forward)\b/i.test(s);
}

function detectsDocumentAction(snippet) {
    return /\b(generate|create|make|prepare|build|export|turn)\b/i.test(snippet) &&
        /\b(pdf|docx|word|document|report|brief|attachment)\b/i.test(snippet);
}

function detectsDriveReadAction(snippet) {
    return /\b(google drive|drive)\b/i.test(snippet) &&
        /\b(search|find|list|read|open|look|download|get)\b/i.test(snippet);
}

function detectsDriveWriteAction(snippet) {
    const s = String(snippet || '');
    return /\b(upload|save to drive|move file|delete file|rename file)\b/i.test(s) ||
        /\bcreate\b.*\bfolder\b/i.test(s);
}

function detectsGithubAction(snippet) {
    const s = String(snippet || '').toLowerCase();
    if (/\b(github|repository|repositories|repo|codebase|commits?|pull requests?|\bprs?\b|branches?)\b/.test(s)) return true;
    if (/\b(this file|this folder|this module|authService|\.tsx|\.ts|\.jsx|\.js\b|package\.json)\b/.test(s)) return true;
    if (/\b(what does .+ do|explain (the )?file|read (the )?file)\b/.test(s)) return true;
    if (/\b(find|search|locate|which)\b/.test(s) && /\b(file|files|module|code|handler|function)\b/.test(s)) return true;
    return false;
}

function detectsProjectAction(snippet) {
    return /\b(reminder|milestone|log work|work session|standup|stand-up)\b/i.test(snippet);
}

/**
 * Resolve capability groups for a user message (composable, not mutually exclusive).
 * @returns {Promise<{ capabilities: string[], profileLabel: string }>}
 */
async function resolveAgentCapabilities(groq, userMessage, options = {}) {
    const snippet = String(userMessage || '').trim().slice(0, 400);
    const { currentArtifact, githubContext, githubConnected } = options;
    const capabilities = new Set([CAPABILITIES.KNOWLEDGE]);

    if (!snippet) {
        return { capabilities: [CAPABILITIES.KNOWLEDGE], profileLabel: 'chat' };
    }

    const emailAction = detectsEmailAction(snippet);
    const documentAction = detectsDocumentAction(snippet);
    const driveReadAction = detectsDriveReadAction(snippet);
    const driveWriteAction = detectsDriveWriteAction(snippet);
    const githubAction = detectsGithubAction(snippet);
    const projectAction = detectsProjectAction(snippet);
    const followUpDoc = isFollowUpDocumentAction(snippet, currentArtifact);

    if (followUpDoc) {
        capabilities.add(CAPABILITIES.DOCUMENT);
        capabilities.add(CAPABILITIES.EMAIL);
    }

    if (emailAction) {
        capabilities.add(CAPABILITIES.DOCUMENT);
        capabilities.add(CAPABILITIES.EMAIL);
    }

    if (documentAction) {
        capabilities.add(CAPABILITIES.DOCUMENT);
    }

    if (driveReadAction) {
        capabilities.add(CAPABILITIES.DRIVE_READ);
    }

    if (driveWriteAction) {
        capabilities.add(CAPABILITIES.DRIVE_READ);
        capabilities.add(CAPABILITIES.DRIVE_WRITE);
    }

    if (projectAction) {
        capabilities.add(CAPABILITIES.PROJECT_ACTION);
    }

    if (githubContext && githubConnected) {
        capabilities.add(CAPABILITIES.GITHUB);
        if (!emailAction && !documentAction && !followUpDoc) {
            const caps = [CAPABILITIES.KNOWLEDGE, CAPABILITIES.GITHUB];
            console.log('[Agent] Capabilities: knowledge + github (scoped context)');
            return { capabilities: caps, profileLabel: 'github_read' };
        }
    }

    if (githubAction && githubConnected) {
        capabilities.add(CAPABILITIES.GITHUB);
    }

  // LLM assist for ambiguous multi-step phrasing (only when heuristics are thin)
    const needsLlmAssist = !emailAction && !documentAction && !githubAction && !projectAction &&
        !driveReadAction && !driveWriteAction && snippet.length > 20;

    if (needsLlmAssist && groq) {
        try {
            const response = await safeGroqCompletion({
                model: ROUTING_MODEL,
                messages: [{
                    role: 'user',
                    content: `List ALL applicable capability tags for this user message (comma-separated, no other text):
knowledge, drive_read, drive_write, github, document, email, project_action

Rules:
- email/mail/send to an address → document, email (NOT github alone)
- tech stack / project questions without GitHub repo context → knowledge only (not github)
- commits/PRs/files/repos → github
- create PDF/DOCX → document
- reminders/milestones → project_action

Message: ${snippet.replace(/"/g, "'")}

Capabilities:`
                }],
                max_tokens: 32,
                temperature: 0
            });

            const raw = response.choices[0]?.message?.content || '';
            const tags = raw.toLowerCase().match(
                /knowledge|drive_read|drive_write|github|document|email|project_action/g
            ) || [];
            tags.forEach((tag) => {
                if (tag === 'knowledge') capabilities.add(CAPABILITIES.KNOWLEDGE);
                if (tag === 'drive_read') capabilities.add(CAPABILITIES.DRIVE_READ);
                if (tag === 'drive_write') {
                    capabilities.add(CAPABILITIES.DRIVE_READ);
                    capabilities.add(CAPABILITIES.DRIVE_WRITE);
                }
                if (tag === 'github' && githubConnected) capabilities.add(CAPABILITIES.GITHUB);
                if (tag === 'document') capabilities.add(CAPABILITIES.DOCUMENT);
                if (tag === 'email') {
                    capabilities.add(CAPABILITIES.DOCUMENT);
                    capabilities.add(CAPABILITIES.EMAIL);
                }
                if (tag === 'project_action') capabilities.add(CAPABILITIES.PROJECT_ACTION);
            });
        } catch (error) {
            console.warn('[Agent] Capability LLM assist failed:', error.message);
        }
    }

    const capsArray = [...capabilities];
    const profileLabel = profileLabelFromCapabilities(capsArray);
    console.log(`[Agent] Capabilities: ${capsArray.join(', ')} (profile=${profileLabel})`);
    return { capabilities: capsArray, profileLabel };
}

function profileLabelFromCapabilities(capabilities = []) {
    const caps = new Set(capabilities);
    if (caps.has(CAPABILITIES.EMAIL) || caps.has(CAPABILITIES.DOCUMENT)) {
        return 'document';
    }
    if (caps.has(CAPABILITIES.DRIVE_WRITE)) return 'full';
    if (caps.has(CAPABILITIES.GITHUB) && !caps.has(CAPABILITIES.DRIVE_READ)) return 'github_read';
    if (caps.has(CAPABILITIES.DRIVE_READ)) return 'drive_read';
    if (caps.has(CAPABILITIES.PROJECT_ACTION)) return 'project_action';
    if (caps.size === 1 && caps.has(CAPABILITIES.KNOWLEDGE)) return 'chat';
    return 'document';
}

function capabilitiesFromProfile(profile) {
    const caps = new Set([CAPABILITIES.KNOWLEDGE]);
    switch (profile) {
        case 'chat':
            break;
        case 'drive_read':
            caps.add(CAPABILITIES.DRIVE_READ);
            break;
        case 'github_read':
            caps.add(CAPABILITIES.GITHUB);
            break;
        case 'document':
            caps.add(CAPABILITIES.DOCUMENT);
            caps.add(CAPABILITIES.EMAIL);
            break;
        case 'project_action':
            caps.add(CAPABILITIES.PROJECT_ACTION);
            break;
        case 'full':
            caps.add(CAPABILITIES.DRIVE_READ);
            caps.add(CAPABILITIES.DRIVE_WRITE);
            caps.add(CAPABILITIES.GITHUB);
            caps.add(CAPABILITIES.DOCUMENT);
            caps.add(CAPABILITIES.EMAIL);
            caps.add(CAPABILITIES.PROJECT_ACTION);
            break;
        default:
            break;
    }
    return [...caps];
}

/** @deprecated Use resolveAgentCapabilities — kept for tests and logging */
async function resolveAgentProfile(groq, userMessage, options = {}) {
    const { profileLabel } = await resolveAgentCapabilities(groq, userMessage, options);
    return VALID_PROFILES.has(profileLabel) ? profileLabel : 'chat';
}

module.exports = {
    ROUTING_MODEL,
    CAPABILITIES,
    VALID_PROFILES,
    resolveAgentCapabilities,
    resolveAgentProfile,
    profileLabelFromCapabilities,
    capabilitiesFromProfile,
    isFollowUpDocumentAction,
    detectsEmailAction,
    detectsGithubAction
};
