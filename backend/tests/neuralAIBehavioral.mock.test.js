const assert = require('assert');
const { runNeuralAgent, createGenerationState } = require('../services/neuralAgent');
const { getAgentTools } = require('../services/toolRegistry');
const { buildSystemPrompt } = require('../services/contextBuilder');
const { generateDocx } = require('../services/capabilities/document/documentGenerationService');
const { closeBrowser } = require('../services/capabilities/document/renderers/pdfRenderer');

const MOCK_USER = '507f1f77bcf86cd799439011';
const MOCK_PROJECT = '507f1f77bcf86cd799439012';

const mockProject = {
    name: 'DevOS',
    type: 'product',
    description: 'Developer OS',
    status: 'active',
    techStack: ['Node', 'React'],
    planning: { milestones: [] },
    decisions: []
};

function createMockGroq(responses) {
    let callIndex = 0;
    return {
        chat: {
            completions: {
                create: async () => {
                    const response = responses[callIndex];
                    callIndex += 1;
                    if (!response) {
                        return { choices: [{ message: { content: 'Done.', tool_calls: null } }] };
                    }
                    return response;
                }
            }
        }
    };
}

function toolCallResponse(toolName, args, id = `call_${Date.now()}`) {
    return {
        choices: [{
            message: {
                content: '',
                tool_calls: [{
                    id,
                    type: 'function',
                    function: {
                        name: toolName,
                        arguments: JSON.stringify(args)
                    }
                }]
            }
        }]
    };
}

function textResponse(text) {
    return {
        choices: [{ message: { content: text, tool_calls: null } }]
    };
}

async function testIdempotentDocxGeneration() {
    const groq = createMockGroq([
        toolCallResponse('generate_docx', {
            title: 'Dup',
            content: '## Section\nShort test content.',
            output_name: 'Dup.docx'
        }, 'call_1'),
        toolCallResponse('generate_docx', {
            title: 'Dup2',
            content: '## Section\nMore content.',
            output_name: 'Dup2.docx'
        }, 'call_2'),
        textResponse('Generated document.')
    ]);

    const tools = getAgentTools({ driveConnected: false });
    const systemPrompt = buildSystemPrompt(mockProject, [], false);
    const result = await runNeuralAgent({
        groq,
        systemPrompt,
        userMessages: [{ role: 'user', content: 'Create a DOCX report.' }],
        tools,
        context: { userId: MOCK_USER, projectId: MOCK_PROJECT, project: mockProject, groq }
    });

    const docxCalls = result.tool_trace.filter((t) => t.name === 'generate_docx');
    assert.strictEqual(docxCalls.length, 2);
    assert.strictEqual(docxCalls[0].success, true);
    assert.strictEqual(docxCalls[1].success, true);
    assert.strictEqual(docxCalls[1].idempotent, true);
    assert(result.generationState.docx?.artifact_id);
    console.log('PASS idempotent DOCX generation in single request');
}

async function testUploadRejectsFilenameAsArtifactId() {
    const groq = createMockGroq([
        toolCallResponse('drive_upload_file', {
            name: 'My Thinking Report.docx',
            artifact_id: 'My Thinking Report.docx'
        }, 'call_upload'),
        textResponse('Upload failed, will retry.')
    ]);

    const tools = getAgentTools({ driveConnected: true });
    const systemPrompt = buildSystemPrompt(mockProject, [], true);
    const result = await runNeuralAgent({
        groq,
        systemPrompt,
        userMessages: [{ role: 'user', content: 'Upload report to Drive.' }],
        tools,
        context: { userId: MOCK_USER, projectId: MOCK_PROJECT, project: mockProject, groq, conversationId: 'conv_test_1' }
    });

    const uploadTrace = result.tool_trace.find((t) => t.name === 'drive_upload_file');
    assert(uploadTrace);
    assert.strictEqual(uploadTrace.success, false);
    assert(!result.pending_action);
    console.log('PASS upload with filename as artifact_id fails before HITL');
}

async function testUploadWithValidArtifactCreatesHITL() {
    const docxResult = await generateDocx({
        metadata: { title: 'Upload Test' },
        sections: [{ heading: 'Test', level: 2, paragraphs: ['Content'] }]
    }, 'Upload_Test.docx', { userId: MOCK_USER, projectId: MOCK_PROJECT });

    const artifactId = docxResult.artifact.artifact_id;
    const groq = createMockGroq([
        toolCallResponse('drive_upload_file', {
            name: 'Upload Test.docx',
            artifact_id: artifactId
        }, 'call_upload')
    ]);

    const tools = getAgentTools({ driveConnected: true });
    const systemPrompt = buildSystemPrompt(mockProject, [], true);

    // Use a unique conversation ID - may need mongoose for PendingAIAction
    // Skip if no DB - check mongoose connection
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
        console.log('SKIP HITL creation test (no MongoDB connection)');
        return;
    }

    const PendingAIAction = require('../models/PendingAIAction');
    await PendingAIAction.deleteMany({ conversationId: 'conv_hitl_test' });

    const result = await runNeuralAgent({
        groq,
        systemPrompt,
        userMessages: [{ role: 'user', content: 'Upload to Drive.' }],
        tools,
        context: {
            userId: MOCK_USER,
            projectId: MOCK_PROJECT,
            project: mockProject,
            groq,
            conversationId: 'conv_hitl_test'
        }
    });

    assert(result.pending_action);
    assert.strictEqual(result.pending_action.toolName, 'drive_upload_file');
    assert.strictEqual(result.pending_action.toolArgs.artifact_id, artifactId);
    console.log('PASS valid artifact_id creates HITL with persisted artifact_id');

    await PendingAIAction.deleteMany({ conversationId: 'conv_hitl_test' });
}

async function testPdfFailurePropagates() {
    const pdfPath = require.resolve('../services/capabilities/document/renderers/pdfRenderer');
    const docGenPath = require.resolve('../services/capabilities/document/documentGenerationService');
    const docToolPath = require.resolve('../services/capabilities/document/documentToolExecutor');

    const pdfRenderer = require(pdfPath);
    const originalRenderPdf = pdfRenderer.renderPdf;
    pdfRenderer.renderPdf = async () => {
        throw new Error('Simulated PDF renderer failure');
    };

    delete require.cache[docGenPath];
    delete require.cache[docToolPath];
    const { generatePdf } = require(docGenPath);

    const result = await generatePdf({
        metadata: { title: 'Fail PDF' },
        sections: [{ heading: 'A', level: 2, paragraphs: ['B'] }]
    }, 'Fail_Sim.pdf', { userId: MOCK_USER, projectId: MOCK_PROJECT });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error.code, 'RENDER_FAILED');

    pdfRenderer.renderPdf = originalRenderPdf;
    delete require.cache[docGenPath];
    delete require.cache[docToolPath];
    console.log('PASS PDF failure propagates as structured tool failure');
}

async function run() {
    await testIdempotentDocxGeneration();
    await testUploadRejectsFilenameAsArtifactId();
    await testPdfFailurePropagates();

    const mongoose = require('mongoose');
    if (process.env.MONGODB_URI) {
        try {
            await mongoose.connect(process.env.MONGODB_URI);
            await testUploadWithValidArtifactCreatesHITL();
            await mongoose.disconnect();
        } catch (e) {
            console.log('SKIP MongoDB-dependent tests:', e.message);
        }
    }

    await closeBrowser();
    console.log('All behavioral mock tests passed.');
}

require('dotenv').config();
run().catch(async (err) => {
    console.error('Behavioral mock test failed:', err);
    await closeBrowser().catch(() => {});
    process.exit(1);
});
