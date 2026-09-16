const assert = require('assert');
const { isWriteTool, buildApprovalDescription } = require('../services/driveToolDefinitions');
const { encrypt, decrypt } = require('../utils/credentialService');
const { getEmbeddingModelName } = require('../services/ragService');
const { parseFailedToolGeneration } = require('../services/groqToolRecovery');
const { getAgentTools } = require('../services/toolRegistry');
const { MAX_AGENT_ITERATIONS } = require('../services/neuralAgent');

function testCredentialEncryption() {
    const original = 'test-refresh-token-value';
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);
    assert.strictEqual(decrypted, original);
    assert.notStrictEqual(encrypted, original);
    console.log('PASS credential encryption roundtrip');
}

function testWriteToolDetection() {
    assert.strictEqual(isWriteTool('drive_delete_file'), true);
    assert.strictEqual(isWriteTool('drive_search'), false);
    assert.strictEqual(isWriteTool('drive_read_file'), false);
    console.log('PASS write tool detection');
}

function testApprovalDescription() {
    const description = buildApprovalDescription('drive_delete_file', { file_id: 'abc123' }, { name: 'DevOS Draft.docx' });
    assert(description.includes('Delete file'));
    assert(description.includes('DevOS Draft.docx'));
    console.log('PASS approval description');
}

function testEmbeddingModelConfig() {
    assert.strictEqual(getEmbeddingModelName(), process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-001');
    console.log('PASS embedding model config');
}

function testFailedGenerationParser() {
    const parsed = parseFailedToolGeneration('<function=drive_search {"query": "DevOS project synopsis"} </function>');
    assert.strictEqual(parsed.toolName, 'drive_search');
    assert.strictEqual(parsed.toolArgs.query, 'DevOS project synopsis');
    console.log('PASS failed generation parser');
}

function testAgentToolRegistry() {
    const withoutDrive = getAgentTools({ driveConnected: false, profile: 'full' });
    const withDrive = getAgentTools({ driveConnected: true, profile: 'full' });
    const chatProfile = getAgentTools({ driveConnected: false, profile: 'chat' });
    assert.strictEqual(withoutDrive.length, 8);
    assert(chatProfile.some((tool) => tool.function.name === 'search_project_knowledge'));
    assert(withDrive.length > withoutDrive.length);
    assert(withDrive.some((tool) => tool.function.name === 'drive_search'));
    assert(withDrive.some((tool) => tool.function.name === 'drive_read_file'));
    assert(withoutDrive.some((tool) => tool.function.name === 'generate_docx'));
    assert(withoutDrive.some((tool) => tool.function.name === 'generate_pdf'));
    console.log('PASS agent tool registry');
}

function testAgentIterationLimit() {
    assert(MAX_AGENT_ITERATIONS >= 5 && MAX_AGENT_ITERATIONS <= 10);
    console.log('PASS agent iteration limit');
}

testCredentialEncryption();
testWriteToolDetection();
testApprovalDescription();
testEmbeddingModelConfig();
testFailedGenerationParser();
testAgentToolRegistry();
testAgentIterationLimit();
console.log('All integration unit checks passed.');
