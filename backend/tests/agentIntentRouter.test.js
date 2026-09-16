/**
 * Agent intent routing and tool composition tests (no live Groq required).
 */
const assert = require('assert');
const {
    resolveAgentCapabilities,
    CAPABILITIES,
    detectsEmailAction,
    detectsGithubAction
} = require('../services/agentIntentRouter');
const { getAgentTools } = require('../services/toolRegistry');
const {
    normalizeToolName,
    buildUnavailableToolError,
    TOOL_ALIASES
} = require('../services/toolCatalog');
const {
    parseFailedToolGeneration,
    recoverToolCallFromError
} = require('../services/groqToolRecovery');

const ROUTING_OPTS = { githubConnected: true, githubContext: null, currentArtifact: null };

async function route(message, opts = ROUTING_OPTS) {
    const result = await resolveAgentCapabilities(null, message, opts);
    return result;
}

function toolsFor(caps) {
    return getAgentTools({
        driveConnected: true,
        githubConnected: true,
        capabilities: caps
    }).map((t) => t.function.name);
}

const MATRIX = [
    {
        prompt: 'What tech stack are we using?',
        expectCaps: ['knowledge'],
        expectTools: ['search_project_knowledge'],
        hitl: false
    },
    {
        prompt: 'email the tech stack used in this project to vansharrow@gmail.com',
        expectCaps: ['knowledge', 'document', 'email'],
        expectTools: ['generate_docx', 'generate_pdf', 'send_document_email'],
        hitl: true
    },
    {
        prompt: 'Create a PDF of the project tech stack',
        expectCaps: ['knowledge', 'document'],
        expectTools: ['generate_pdf'],
        hitl: false
    },
    {
        prompt: 'send the generated report to vansharrow@gmail.com',
        expectCaps: ['knowledge', 'document', 'email'],
        expectTools: ['send_document_email'],
        hitl: true
    },
    {
        prompt: 'what commits changed recently?',
        expectCaps: ['knowledge', 'github'],
        expectTools: ['github_list_commits'],
        hitl: false
    },
    {
        prompt: 'what does authService.js do?',
        expectCaps: ['knowledge', 'github'],
        expectTools: ['github_get_file'],
        hitl: false
    },
    {
        prompt: 'mail me the stack',
        expectCaps: ['knowledge', 'document', 'email'],
        hitl: true
    },
    {
        prompt: 'send me the technologies we are using',
        expectCaps: ['knowledge'],
        hitl: false
    },
    {
        prompt: 'email the tech stack to Vansh at vansharrow@gmail.com',
        expectCaps: ['knowledge', 'document', 'email'],
        hitl: true
    },
    {
        prompt: 'make a doc with our stack and send it to me at test@example.com',
        expectCaps: ['knowledge', 'document', 'email'],
        hitl: true
    },
    {
        prompt: 'prepare a tech stack summary and email it to vansharrow@gmail.com',
        expectCaps: ['knowledge', 'document', 'email'],
        hitl: true
    },
    {
        prompt: 'Summarize the latest GitHub commits and email the summary to vansharrow@gmail.com',
        expectCaps: ['knowledge', 'github', 'document', 'email'],
        hitl: true
    },
    {
        prompt: 'Tell me about the latest GitHub commit',
        expectCaps: ['knowledge', 'github'],
        hitl: false
    },
    {
        prompt: 'Create a reminder for next Friday to review the PRD',
        expectCaps: ['knowledge', 'project_action'],
        expectTools: ['create_reminder'],
        hitl: false
    },
    {
        prompt: 'Search my Google Drive for architecture docs',
        expectCaps: ['knowledge', 'drive_read'],
        expectTools: ['drive_search'],
        hitl: false
    },
    {
        prompt: 'Upload the report to my Drive folder Projects',
        expectCaps: ['knowledge', 'drive_read', 'drive_write'],
        expectTools: ['drive_upload_file'],
        hitl: true
    },
    {
        prompt: 'Create a PDF from the GitHub changes and email it to vansharrow@gmail.com',
        expectCaps: ['knowledge', 'github', 'document', 'email'],
        hitl: true
    },
    {
        prompt: 'What did we work on in the last session?',
        expectCaps: ['knowledge'],
        hitl: false
    },
    {
        prompt: 'List open pull requests on the repo',
        expectCaps: ['knowledge', 'github'],
        expectTools: ['github_list_pull_requests'],
        hitl: false
    },
    {
        prompt: 'Explain the authentication module in authService.js',
        expectCaps: ['knowledge', 'github'],
        hitl: false
    },
    {
        prompt: 'Generate a DOCX status report for stakeholders',
        expectCaps: ['knowledge', 'document'],
        hitl: false
    },
    {
        prompt: 'Email our PRD summary to client@company.com',
        expectCaps: ['knowledge', 'document', 'email'],
        hitl: true
    },
    {
        prompt: 'Find the file that handles JWT validation',
        expectCaps: ['knowledge', 'github'],
        hitl: false
    },
    {
        prompt: 'Mark milestone "MVP launch" as done',
        expectCaps: ['knowledge', 'project_action'],
        hitl: false
    },
    {
        prompt: 'Log a work session: fixed login bug, next step deploy',
        expectCaps: ['knowledge', 'project_action'],
        hitl: false
    },
    {
        prompt: 'Read the README from GitHub',
        expectCaps: ['knowledge', 'github'],
        hitl: false
    },
    {
        prompt: 'Create a folder in Drive called Neural Reports',
        expectCaps: ['knowledge', 'drive_read', 'drive_write'],
        hitl: true
    },
    {
        prompt: 'What is our project deadline?',
        expectCaps: ['knowledge'],
        hitl: false
    },
    {
        prompt: 'Compare our frontend and backend stack',
        expectCaps: ['knowledge'],
        hitl: false
    },
    {
        prompt: 'Download the architecture PDF from Drive',
        expectCaps: ['knowledge', 'drive_read'],
        hitl: false
    },
    {
        prompt: 'Create a PDF of the tech stack and email it to vansharrow@gmail.com',
        expectCaps: ['knowledge', 'document', 'email'],
        hitl: true
    },
    {
        prompt: 'email it',
        expectCaps: ['knowledge', 'document', 'email'],
        opts: { githubConnected: true, currentArtifact: { artifact_id: 'art_1786868674898_nkkfwh' } },
        hitl: true
    },
    {
        prompt: 'What branches exist on the repository?',
        expectCaps: ['knowledge', 'github'],
        hitl: false
    },
    {
        prompt: 'Send standup email to vansharrow@gmail.com',
        expectCaps: ['knowledge', 'project_action'],
        expectTools: ['send_standup_email'],
        hitl: false
    }
];

async function runMatrix() {
    let passed = 0;
    for (const row of MATRIX) {
        const { capabilities, profileLabel } = await route(row.prompt, row.opts || ROUTING_OPTS);
        const capSet = new Set(capabilities);

        for (const cap of row.expectCaps) {
            assert(capSet.has(cap), `"${row.prompt}" missing capability ${cap}, got ${capabilities.join(',')}`);
        }

        if (row.expectTools) {
            const toolNames = toolsFor(capabilities);
            for (const tool of row.expectTools) {
                assert(toolNames.includes(tool), `"${row.prompt}" missing tool ${tool} in ${toolNames.join(',')}`);
            }
        }

        if (row.hitl) {
            const toolNames = toolsFor(capabilities);
            const hasHitlTool = toolNames.includes('send_document_email') ||
                toolNames.includes('drive_upload_file') ||
                toolNames.includes('drive_delete_file');
            assert(hasHitlTool || row.expectCaps.includes('project_action'),
                `"${row.prompt}" expected HITL-related tools`);
        }

        passed += 1;
        console.log(`PASS routing: ${row.prompt.slice(0, 50)}… → ${profileLabel} [${capabilities.join(',')}]`);
    }
    console.log(`PASS matrix: ${passed}/${MATRIX.length} cases`);
}

function testEmailDetection() {
    assert.strictEqual(detectsEmailAction('email the tech stack to vansharrow@gmail.com'), true);
    assert.strictEqual(detectsEmailAction('send me the technologies we are using'), false);
    assert.strictEqual(detectsGithubAction('what commits changed recently?'), true);
    assert.strictEqual(detectsGithubAction('email the tech stack to test@example.com'), false);
    console.log('PASS email/github heuristics');
}

function testToolAliases() {
    const allowed = ['send_document_email', 'generate_docx'];
    assert.strictEqual(normalizeToolName('send_email', allowed), 'send_document_email');
    assert.strictEqual(normalizeToolName('send_document_email', allowed), 'send_document_email');
    assert.strictEqual(normalizeToolName('send_email', ['generate_docx']), null);
    assert.strictEqual(TOOL_ALIASES.send_email, 'send_document_email');
    console.log('PASS tool alias normalization');
}

function testUnavailableToolError() {
    const err = buildUnavailableToolError('send_email', ['generate_docx', 'send_document_email']);
    assert(err.error.code === 'TOOL_NOT_AVAILABLE');
    assert(err.error.message.includes('send_document_email'));
    console.log('PASS unavailable tool error');
}

function testMalformedRecovery() {
    const malformed = '<function=send_document_email,{"recipient_email":"test@example.com","artifact_id":"tech_stack"}>';
    const parsed = parseFailedToolGeneration(malformed);
    assert(parsed);
    assert.strictEqual(parsed.toolName, 'send_document_email');
    assert.strictEqual(parsed.toolArgs.recipient_email, 'test@example.com');

    const allowed = ['send_document_email', 'generate_docx'];
    const fakeError = {
        message: '400 tool_use_failed',
        error: { code: 'tool_use_failed', failed_generation: malformed }
    };
    const recovered = recoverToolCallFromError(fakeError, allowed);
    assert(recovered);
    assert.strictEqual(recovered.toolName, 'send_document_email');

    const blocked = recoverToolCallFromError(fakeError, ['generate_docx']);
    assert.strictEqual(blocked, null);
    console.log('PASS malformed tool recovery');
}

async function testFailingCaseNoGithub() {
    const { capabilities } = await route(
        'email the tech stack used in this project to vansharrow@gmail.com'
    );
    assert(!capabilities.includes('github') || capabilities.includes('document'),
        'email tech stack should not be github-only');
    assert(capabilities.includes('email'));
    assert(capabilities.includes('document'));
    const tools = toolsFor(capabilities);
    assert(tools.includes('send_document_email'));
    assert(tools.includes('generate_docx'));
    console.log('PASS exact failing case routing');
}

async function main() {
    testEmailDetection();
    testToolAliases();
    testUnavailableToolError();
    testMalformedRecovery();
    await testFailingCaseNoGithub();
    await runMatrix();
    console.log('All agent intent router tests passed.');
}

main().catch((err) => {
    console.error('FAIL', err.message);
    process.exit(1);
});
