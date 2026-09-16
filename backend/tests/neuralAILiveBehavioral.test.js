/**
 * Live LLM behavioral probes — results depend on model behavior.
 * Run: node tests/neuralAILiveBehavioral.test.js
 */
require('dotenv').config();
const Groq = require('groq-sdk');
const mongoose = require('mongoose');
const { runNeuralAgent } = require('../services/neuralAgent');
const { getAgentTools } = require('../services/toolRegistry');
const { buildSystemPrompt } = require('../services/contextBuilder');
const { closeBrowser } = require('../services/capabilities/document/renderers/pdfRenderer');

const MOCK_USER = '507f1f77bcf86cd799439011';
const MOCK_PROJECT = '507f1f77bcf86cd799439012';

const mockProject = {
    name: 'DevOS',
    type: 'product',
    description: 'Developer operating system for tracking daily work',
    status: 'active',
    techStack: ['Node.js', 'React', 'MongoDB'],
    nextPlannedStep: 'Neural AI stabilization',
    planning: { milestones: [{ title: 'Conversation memory', status: 'completed' }] },
    decisions: [],
    requirements: {}
};

const TESTS = [
    {
        id: 1,
        prompt: 'What do you think about DevOS?',
        forbidden: ['generate_docx', 'generate_pdf', 'drive_upload_file', 'drive_create_folder', 'log_work_session']
    },
    {
        id: 2,
        prompt: 'My main project is DevOS and it helps developers track their daily work.',
        forbidden: ['log_work_session', 'mark_milestone_done', 'drive_create_folder', 'send_standup_email', 'create_reminder']
    },
    {
        id: 5,
        prompt: 'Create a professionally formatted DOCX project report about the current stage of DevOS.',
        required: ['generate_docx'],
        forbidden: ['generate_pdf', 'drive_upload_file']
    },
    {
        id: 10,
        prompt: 'What capabilities of DevOS are implemented right now?',
        forbidden: ['generate_docx', 'generate_pdf', 'drive_upload_file']
    }
];

function evaluateTest(test, result) {
    const tools = result.tool_trace?.map((t) => t.name) || result.actions_taken || [];
    const notes = [];

    if (test.forbidden) {
        const violations = test.forbidden.filter((t) => tools.includes(t));
        if (violations.length) notes.push(`Forbidden tools called: ${violations.join(', ')}`);
    }
    if (test.required) {
        const missing = test.required.filter((t) => !tools.includes(t));
        if (missing.length) notes.push(`Missing required tools: ${missing.join(', ')}`);
    }

    const pass = notes.length === 0;
    return { pass, tools, notes };
}

async function runLiveTests() {
    if (!process.env.GROQ_API_KEY) {
        console.log('SKIP live tests: GROQ_API_KEY not set');
        return [];
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const tools = getAgentTools({ driveConnected: true });
    const systemPrompt = buildSystemPrompt(mockProject, [], true);
    const results = [];

    for (const test of TESTS) {
        process.stdout.write(`Running test ${test.id}... `);
        try {
            const result = await runNeuralAgent({
                groq,
                systemPrompt,
                userMessages: [{ role: 'user', content: test.prompt }],
                tools,
                context: {
                    userId: MOCK_USER,
                    projectId: MOCK_PROJECT,
                    project: mockProject,
                    groq
                }
            });

            const evaluation = evaluateTest(test, result);
            results.push({
                test: test.id,
                result: evaluation.pass ? 'PASS' : 'FAIL',
                tools: evaluation.tools,
                notes: evaluation.notes.join('; ') || 'OK'
            });
            console.log(evaluation.pass ? 'PASS' : 'FAIL');
        } catch (err) {
            results.push({
                test: test.id,
                result: 'ERROR',
                tools: [],
                notes: err.message
            });
            console.log('ERROR');
        }
    }

    return results;
}

async function main() {
    console.log('Neural AI Live Behavioral Tests');
    console.log('================================');

    const results = await runLiveTests();

    if (results.length) {
        console.log('\nTest | Result | Tools Called | Notes');
        console.log('-----|--------|--------------|------');
        for (const r of results) {
            console.log(`${r.test} | ${r.result} | ${r.tools.join(', ') || 'none'} | ${r.notes}`);
        }
    }

    await closeBrowser().catch(() => {});
    if (mongoose.connection.readyState === 1) await mongoose.disconnect();
}

main().catch(async (err) => {
    console.error(err);
    await closeBrowser().catch(() => {});
    process.exit(1);
});
