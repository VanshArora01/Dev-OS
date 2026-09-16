/**
 * PRD chunking + Qdrant RAG tests
 * Run: node backend/tests/ragPrd.test.js
 * Optional live Qdrant: node backend/tests/ragPrd.test.js --live
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { chunkPrdText } = require('../services/prdChunker');
const {
    embedText,
    getEmbeddingModelName,
    isQdrantConfigured,
    getCollectionName,
    indexPrdDocument,
    searchProjectKnowledge,
    getVerifiedVectorSize
} = require('../services/ragService');

const SAMPLE_PRD = fs.readFileSync(
    path.join(__dirname, 'fixtures/sample-shopflow-prd.txt'),
    'utf-8'
);

const TEST_USER_ID = '507f1f77bcf86cd799439011';
const TEST_PROJECT_ID = '507f1f77bcf86cd799439012';
const TEST_PROJECT_B = '507f1f77bcf86cd799439013';

function testSemanticChunking() {
    const chunks = chunkPrdText(SAMPLE_PRD);
    assert(chunks.length >= 5, `Expected >= 5 chunks, got ${chunks.length}`);
    assert(chunks.every((c) => c.section && c.text && c.chunkIndex >= 0));
    const hasRequirements = chunks.some((c) =>
        /functional requirements|authentication|FR-/i.test(c.section + c.text)
    );
    assert(hasRequirements, 'Expected functional requirements section in chunks');
    console.log(`✓ Semantic chunking: ${chunks.length} chunks`);
}

async function testEmbeddingDimension() {
    const embedding = await embedText('ShopFlow e-commerce authentication test');
    assert(embedding.length > 0, 'Embedding should not be empty');
    console.log(`✓ Embedding model ${getEmbeddingModelName()} → dim=${embedding.length}`);
    return embedding.length;
}

async function runLiveQdrantTests() {
    if (!isQdrantConfigured()) {
        console.log('⚠ Skipping live Qdrant tests — QDRANT_URL not set');
        return;
    }
    if (!process.env.GEMINI_API_KEY) {
        console.log('⚠ Skipping live Qdrant tests — GEMINI_API_KEY not set');
        return;
    }
    if (!process.env.MONGODB_URI) {
        console.log('⚠ Skipping live Qdrant tests — MONGODB_URI not set');
        return;
    }

    const mongoose = require('mongoose');
    await mongoose.connect(process.env.MONGODB_URI);

    console.log(`→ Live Qdrant tests (collection: ${getCollectionName()})`);

    const indexResult = await indexPrdDocument(TEST_USER_ID, TEST_PROJECT_ID, SAMPLE_PRD, {
        filename: 'sample-shopflow-prd.txt',
        sourceDocumentId: `prd-${TEST_PROJECT_ID}`
    });

    assert(indexResult.indexed, `Indexing failed: ${indexResult.reason || indexResult.error}`);
    assert(indexResult.chunkCount >= 5);
    console.log(`✓ PRD indexed: ${indexResult.chunkCount} chunks, dim=${indexResult.vectorDimension}`);

    const testQueries = [
        'What authentication method does the PRD specify?',
        'What is the deadline for final project delivery?',
        'What technologies are required?',
        'FR-AUTH-1',
        'Stripe payment integration'
    ];

    console.log('\n--- Retrieval Quality ---');
    for (const query of testQueries) {
        const results = await searchProjectKnowledge(TEST_USER_ID, query, {
            projectId: TEST_PROJECT_ID,
            limit: 3
        });
        console.log(`\nQuery: "${query}"`);
        if (!results.length) {
            console.log('  (no results above threshold)');
            continue;
        }
        results.forEach((r, i) => {
            console.log(`  [${i + 1}] score=${r.score.toFixed(3)} type=${r.sourceType} section=${r.section}`);
            console.log(`      ${r.content.slice(0, 120).replace(/\n/g, ' ')}...`);
        });
    }

    // Cross-project isolation
    const crossResults = await searchProjectKnowledge(TEST_USER_ID, 'authentication Google OAuth', {
        projectId: TEST_PROJECT_B,
        limit: 3
    });
    assert(crossResults.length === 0, 'Cross-project retrieval should return empty');
    console.log('\n✓ Cross-project isolation verified');

    // PRD-only filter
    const prdResults = await searchProjectKnowledge(TEST_USER_ID, 'MongoDB database', {
        projectId: TEST_PROJECT_ID,
        limit: 3,
        sourceType: 'prd'
    });
    assert(prdResults.every((r) => r.sourceType === 'prd'));
    console.log(`✓ PRD source filter: ${prdResults.length} results`);

    await mongoose.disconnect();
}

async function run() {
    console.log('=== PRD RAG Tests ===\n');
    testSemanticChunking();
    const dim = await testEmbeddingDimension();

    if (process.argv.includes('--live')) {
        await runLiveQdrantTests();
    } else {
        console.log('Run with --live for Qdrant integration tests');
    }

    console.log('\n=== Tests Complete ===');
    console.log(`Vector dimension detected: ${dim}`);
    console.log(`Qdrant configured: ${isQdrantConfigured()}`);
}

run().catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
});
