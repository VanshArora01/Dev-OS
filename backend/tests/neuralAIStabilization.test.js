const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { isValidArtifactIdFormat, validateArtifactForUpload } = require('../services/capabilities/document/artifactValidation');
const { generateDocx, generatePdf } = require('../services/capabilities/document/documentGenerationService');
const { executeDriveTool, MAX_SEARCH_QUERY_LENGTH } = require('../services/driveToolExecutor');
const { createGenerationState } = require('../services/neuralAgent');
const { closeBrowser } = require('../services/capabilities/document/renderers/pdfRenderer');

const MOCK_USER = '507f1f77bcf86cd799439011';
const MOCK_PROJECT = '507f1f77bcf86cd799439012';

const SAMPLE_DOC = {
    template: 'project-report',
    metadata: {
        title: 'DevOS Stabilization Test Report',
        subtitle: 'Neural AI Reliability',
        author: 'DevOS Neural AI',
        organization: 'DevOS',
        documentType: 'Test Report'
    },
    sections: [
        {
            heading: 'Test Section',
            level: 2,
            paragraphs: ['This document validates artifact identity and generation contracts.'],
            bullets: ['Artifact ID format', 'PDF generation', 'Upload validation']
        }
    ]
};

function testArtifactIdFormatValidation() {
    assert.strictEqual(isValidArtifactIdFormat('art_1786730878051_ok55io'), true);
    assert.strictEqual(isValidArtifactIdFormat('My Thinking Report.docx'), false);
    assert.strictEqual(isValidArtifactIdFormat('My_Thinking_Report.docx'), false);
    assert.strictEqual(isValidArtifactIdFormat(''), false);
    console.log('PASS artifact ID format validation');
}

function testInvalidArtifactIdRejection() {
    const result = validateArtifactForUpload(MOCK_USER, MOCK_PROJECT, 'My Thinking Report.docx');
    assert.strictEqual(result.valid, false);
    assert.strictEqual(result.error.code, 'INVALID_ARTIFACT_ID');
    console.log('PASS invalid artifact ID rejection (filename as ID)');
}

async function testDocxArtifactContract() {
    const result = await generateDocx(SAMPLE_DOC, 'Stabilization_Test.docx', {
        userId: MOCK_USER,
        projectId: MOCK_PROJECT
    });
    assert.strictEqual(result.success, true);
    assert(result.artifact);
    assert.strictEqual(isValidArtifactIdFormat(result.artifact.artifact_id), true);
    assert(result.artifact.file_name.endsWith('.docx'));
    assert(result.artifact.mime_type);
    assert(result.artifact.size > 1000);
    assert.strictEqual(result.artifact_id, result.artifact.artifact_id);
    console.log('PASS DOCX artifact contract', result.artifact.artifact_id);
    return result;
}

async function testPdfGeneration() {
    const result = await generatePdf(SAMPLE_DOC, 'Stabilization_Test.pdf', {
        userId: MOCK_USER,
        projectId: MOCK_PROJECT
    });
    assert.strictEqual(result.success, true);
    assert(result.artifact);
    assert.strictEqual(isValidArtifactIdFormat(result.artifact.artifact_id), true);
    assert(result.artifact.file_name.endsWith('.pdf'));
    assert(result.artifact.size > 1000);
    console.log('PASS PDF generation', result.artifact.artifact_id);
    return result;
}

async function testArtifactValidationForUpload(docxResult) {
    const validation = validateArtifactForUpload(
        MOCK_USER,
        MOCK_PROJECT,
        docxResult.artifact.artifact_id
    );
    assert.strictEqual(validation.valid, true);
    assert(validation.meta.file_name);
    console.log('PASS artifact validation for upload');
}

async function testDriveUploadInvalidArtifactId() {
    const result = await executeDriveTool('drive_upload_file', {
        name: 'My Thinking Report.docx',
        artifact_id: 'My Thinking Report.docx'
    }, { userId: MOCK_USER, projectId: MOCK_PROJECT });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error.code, 'INVALID_ARTIFACT_ID');
    console.log('PASS drive_upload_file rejects filename as artifact_id');
}

async function testDriveUploadValidArtifactId(docxResult) {
    const result = await executeDriveTool('drive_upload_file', {
        name: 'Stabilization Test.docx',
        artifact_id: docxResult.artifact.artifact_id
    }, { userId: MOCK_USER, projectId: MOCK_PROJECT });

    // Will fail without Drive connection but should NOT fail with INVALID_ARTIFACT_ID
    if (!result.success) {
        assert.notStrictEqual(result.error?.code, 'INVALID_ARTIFACT_ID');
        assert.notStrictEqual(result.error?.code, 'ARTIFACT_NOT_FOUND');
        console.log('PASS drive_upload_file accepts valid artifact_id (Drive may be disconnected:', result.error?.code || result.error, ')');
    } else {
        assert.strictEqual(result.verified, true);
        console.log('PASS drive_upload_file with valid artifact_id and verification');
    }
}

function testSearchQueryValidation() {
    const longQuery = 'x'.repeat(MAX_SEARCH_QUERY_LENGTH + 1);
    const result = executeDriveTool('search_project_knowledge', { query: longQuery }, {
        userId: MOCK_USER,
        projectId: MOCK_PROJECT
    });

    return result.then((r) => {
        assert.strictEqual(r.success, false);
        assert.strictEqual(r.error.code, 'INVALID_SEARCH_QUERY');
        console.log('PASS search query length validation');
    });
}

function testGenerationState() {
    const state = createGenerationState();
    assert.strictEqual(state.docx, null);
    assert.strictEqual(state.pdf, null);
    state.docx = { artifact_id: 'art_123_test', file_name: 'test.docx' };
    assert.strictEqual(state.docx.artifact_id, 'art_123_test');
    console.log('PASS generation state creation');
}

async function run() {
    testArtifactIdFormatValidation();
    testInvalidArtifactIdRejection();
    testGenerationState();

    const docxResult = await testDocxArtifactContract();
    await testPdfGeneration();
    await testArtifactValidationForUpload(docxResult);
    await testDriveUploadInvalidArtifactId();
    await testDriveUploadValidArtifactId(docxResult);
    await testSearchQueryValidation();

    await closeBrowser();
    console.log('All neural AI stabilization unit tests passed.');
}

run().catch(async (err) => {
    console.error('Stabilization test failed:', err);
    await closeBrowser().catch(() => {});
    process.exit(1);
});
