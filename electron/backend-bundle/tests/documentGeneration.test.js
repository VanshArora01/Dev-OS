const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const { normalizeStructuredDocument, validateStructuredDocument } = require('../services/capabilities/document/models/StructuredDocument');
const { generateDocx, generatePdf } = require('../services/capabilities/document/documentGenerationService');
const { bufferToStream } = require('../services/googleDriveConnector');
const { getDocumentTools } = require('../services/capabilities/document/documentToolDefinitions');
const { getAgentTools } = require('../services/toolRegistry');

const SAMPLE_DOC = {
    template: 'project-report',
    metadata: {
        title: 'DevOS Project Status Report',
        subtitle: 'Project Status & Progress',
        author: 'DevOS Neural AI',
        organization: 'DevOS',
        documentType: 'Project Report'
    },
    sections: [
        {
            heading: 'Executive Summary',
            level: 2,
            callouts: [{
                type: 'info',
                title: 'Status',
                content: 'DevOS has an agentic Neural AI with Google Drive, RAG, and persistent conversations.'
            }],
            paragraphs: ['This report summarizes the current implementation stage based on available project context.']
        },
        {
            heading: 'Implemented Capabilities',
            level: 2,
            bullets: [
                'Groq tool-calling agent loop',
                'Google Drive integration with HITL',
                'RAG project knowledge retrieval',
                'Persistent conversation system',
                'Document generation (DOCX/PDF)'
            ]
        },
        {
            heading: 'Architecture Overview',
            level: 2,
            tables: [{
                headers: ['Layer', 'Status'],
                rows: [
                    ['Agent Loop', 'Implemented'],
                    ['Tool Registry', 'Implemented'],
                    ['Document Service', 'Implemented']
                ]
            }]
        }
    ],
    sources: [
        { title: 'DevOS Project Context', type: 'Project data' },
        { title: 'Neural AI Architecture', type: 'System knowledge' }
    ]
};

const MOCK_USER = '507f1f77bcf86cd799439011';
const MOCK_PROJECT = '507f1f77bcf86cd799439012';

async function testStructuredDocumentValidation() {
    const doc = normalizeStructuredDocument(SAMPLE_DOC, { projectName: 'DevOS' });
    const validation = validateStructuredDocument(doc);
    assert.strictEqual(validation.valid, true);
    assert(doc.metadata.title.includes('DevOS'));
    console.log('PASS structured document validation');
}

async function testDocxGeneration() {
    const result = await generateDocx(SAMPLE_DOC, 'DevOS_Project_Status_Report.docx', {
        userId: MOCK_USER,
        projectId: MOCK_PROJECT
    });
    assert.strictEqual(result.success, true);
    assert(result.artifact_id);
    assert(result.size > 5000);
    assert(result.fileName.endsWith('.docx'));
    console.log('PASS DOCX generation', result.fileName, result.size, 'bytes');
    return result;
}

async function testPdfGeneration() {
    const result = await generatePdf(SAMPLE_DOC, 'DevOS_Project_Status_Report.pdf', {
        userId: MOCK_USER,
        projectId: MOCK_PROJECT
    });
    assert.strictEqual(result.success, true);
    assert(result.artifact_id);
    assert(result.size > 5000);
    assert(result.fileName.endsWith('.pdf'));
    console.log('PASS PDF generation', result.fileName, result.size, 'bytes');
    return result;
}

function testBufferStreamForDrive() {
    const buffer = Buffer.from('test binary content for drive upload');
    const stream = bufferToStream(buffer);
    assert.strictEqual(typeof stream.pipe, 'function');
    console.log('PASS bufferToStream for Google Drive upload');
}

function testToolRegistryIncludesDocumentTools() {
    const tools = getAgentTools({ driveConnected: true });
    const names = tools.map((t) => t.function.name);
    assert(names.includes('generate_docx'));
    assert(names.includes('generate_pdf'));
    assert(names.includes('drive_upload_file'));
    assert.strictEqual(getDocumentTools().length, 2);
    console.log('PASS tool registry includes document tools');
}

async function run() {
    testBufferStreamForDrive();
    testToolRegistryIncludesDocumentTools();
    await testStructuredDocumentValidation();
    await testDocxGeneration();
    await testPdfGeneration();
    console.log('All document generation tests passed.');
}

run().catch((err) => {
    console.error('Document generation test failed:', err);
    process.exit(1);
});
