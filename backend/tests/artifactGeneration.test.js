/**
 * Structured artifact generation tests
 */
const assert = require('assert');
const { classifyArtifactType } = require('../services/capabilities/document/artifactClassifier');
const { extractProjectContext } = require('../services/capabilities/document/projectContextExtractor');
const { buildArtifact, buildTechEntries } = require('../services/capabilities/document/artifactBuilders');
const { generateDocx, generatePdf } = require('../services/capabilities/document/documentGenerationService');
const { executeDocumentTool } = require('../services/capabilities/document/documentToolExecutor');
const { closeBrowser } = require('../services/capabilities/document/renderers/pdfRenderer');

const MOCK_USER = '507f1f77bcf86cd799439011';
const MOCK_PROJECT = '507f1f77bcf86cd799439012';

const MOCK_PROJECT_DATA = {
    name: 'ClientFlow',
    description: 'Client workflow management platform',
    status: 'active',
    priority: 'high',
    currentPhase: 'MVP Development',
    nextPlannedStep: 'Complete authentication module',
    lastSessionSummary: 'Implemented JWT auth and session handling',
    techStack: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'Express.js', 'PostgreSQL', 'JWT', 'bcrypt'],
    techStackDetails: [
        { name: 'React', category: 'Frontend', source: 'UI layer' },
        { name: 'TypeScript', category: 'Frontend', source: 'Type safety' },
        { name: 'Tailwind CSS', category: 'Frontend', source: 'Styling' },
        { name: 'Node.js', category: 'Backend', source: 'Runtime' },
        { name: 'Express.js', category: 'Backend', source: 'REST API framework' },
        { name: 'PostgreSQL', category: 'Database', source: 'Relational database' },
        { name: 'JWT', category: 'Authentication', source: 'Session authentication' },
        { name: 'bcrypt', category: 'Authentication', source: 'Password hashing' },
        { name: 'Google Drive API', category: 'Integration', source: 'File storage integration' }
    ],
    planning: {
        milestones: [
            { title: 'Auth module', status: 'completed', priority: 'high' },
            { title: 'Neural AI integration', status: 'in-progress', priority: 'high' },
            { title: 'Drive upload', status: 'pending', priority: 'medium' }
        ]
    },
    blueprint: {
        project: {
            objective: 'Streamline client workflows',
            targetUsers: 'Small business teams',
            scope: 'Web app with AI assistant'
        },
        requirements: [
            { id: 'FR-01', title: 'User authentication', priority: 'high' },
            { id: 'FR-02', title: 'Project management', priority: 'high' }
        ]
    },
    prdIndexing: { status: 'indexed' },
    prdSource: { filename: 'ClientFlow_PRD.pdf' },
    githubRepositories: [{ fullName: 'org/clientflow' }]
};

function testClassifier() {
    assert.strictEqual(classifyArtifactType('Generate a document of the tech stack'), 'tech_stack');
    assert.strictEqual(classifyArtifactType('Create a project report'), 'project_report');
    assert.strictEqual(classifyArtifactType('short status update'), 'status_update');
    assert.strictEqual(classifyArtifactType('weekly standup'), 'standup');
    console.log('PASS artifact classifier');
}

function testTechStackStructure() {
    const ctx = extractProjectContext(MOCK_PROJECT_DATA);
    const artifact = buildArtifact('tech_stack', ctx);
    assert.strictEqual(artifact.metadata.artifactType, 'tech_stack');
    assert.strictEqual(artifact.layout, 'artifact');

    const tableSections = artifact.sections.filter((s) => s.tables?.length && s.heading);
    assert(tableSections.length >= 3, 'expected categorized tech tables');

    const frontend = tableSections.find((s) => s.heading === 'FRONTEND');
    assert(frontend, 'missing FRONTEND section');
    assert(frontend.tables[0].rows.some((r) => r[0] === 'React'));

    const arch = artifact.sections.find((s) => s.heading === 'Architecture Summary');
    assert(arch?.paragraphs?.length, 'missing architecture summary');

    const grouped = buildTechEntries(ctx);
    assert(grouped.Frontend?.length >= 3);
    console.log('PASS tech stack artifact structure');
}

async function testTechStackDocx() {
    const ctx = extractProjectContext(MOCK_PROJECT_DATA);
    const artifact = buildArtifact('tech_stack', ctx);
    const result = await generateDocx(artifact, 'ClientFlow_Tech_Stack.docx', {
        userId: MOCK_USER,
        projectId: MOCK_PROJECT,
        projectName: 'ClientFlow'
    });
    assert.strictEqual(result.success, true);
    assert(result.artifact_id.startsWith('art_'));
    assert(result.artifact.artifact_type === 'tech_stack');
    assert(result.size > 5000);
    console.log('PASS tech stack DOCX', result.artifact_id);
}

async function testTechStackPdf() {
    const ctx = extractProjectContext(MOCK_PROJECT_DATA);
    const artifact = buildArtifact('tech_stack', ctx);
    const result = await generatePdf(artifact, 'ClientFlow_Tech_Stack.pdf', {
        userId: MOCK_USER,
        projectId: MOCK_PROJECT,
        projectName: 'ClientFlow'
    });
    assert.strictEqual(result.success, true);
    assert(result.artifact_id.startsWith('art_'));
    assert(result.size > 5000);
    console.log('PASS tech stack PDF', result.artifact_id);
}

async function testExecutorTechStack() {
    const result = await executeDocumentTool('generate_docx', {
        artifact_type: 'tech_stack',
        output_name: 'ClientFlow_Tech_Stack.docx'
    }, {
        userId: MOCK_USER,
        projectId: MOCK_PROJECT,
        project: MOCK_PROJECT_DATA,
        lastUserMessage: 'Generate a document containing the ClientFlow tech stack'
    });
    assert.strictEqual(result.success, true);
    assert(result.artifact_type === 'tech_stack' || result.artifact?.artifact_type === 'tech_stack');
    console.log('PASS executor tech_stack path', result.artifact_id);
}

async function testStatusUpdateConcise() {
    const ctx = extractProjectContext(MOCK_PROJECT_DATA);
    const artifact = buildArtifact('status_update', ctx);
    assert.strictEqual(artifact.layout, 'artifact-concise');
    const paraSections = artifact.sections.filter((s) => s.paragraphs?.length);
    assert(paraSections.length <= 3, 'status update should stay concise');
    console.log('PASS status update concise layout');
}

async function testProjectReport() {
    const ctx = extractProjectContext(MOCK_PROJECT_DATA);
    const artifact = buildArtifact('project_report', ctx);
    assert(artifact.sections.some((s) => s.heading === 'Executive Summary'));
    assert(artifact.sections.some((s) => s.heading === 'Completed'));
    assert(artifact.sections.some((s) => s.heading === 'Tech Stack'));
    console.log('PASS project report structure');
}

async function main() {
    testClassifier();
    testTechStackStructure();
    await testTechStackDocx();
    await testTechStackPdf();
    await testExecutorTechStack();
    await testStatusUpdateConcise();
    await testProjectReport();
    await closeBrowser();
    console.log('All artifact generation tests passed.');
}

main().catch(async (err) => {
    console.error('FAIL', err);
    await closeBrowser();
    process.exit(1);
});
