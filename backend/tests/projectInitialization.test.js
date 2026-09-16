/**
 * Integration test for PRD → Blueprint → Project persistence pipeline.
 * Run: node backend/tests/projectInitialization.test.js
 * Requires: GROQ_API_KEY and MongoDB connection in .env
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Project = require('../models/Project');
const User = require('../models/User');
const { extractPrdFromText } = require('../services/projectInitialization/prdTextExtractor');
const { extractBlueprintFromPrd } = require('../services/projectInitialization/blueprintExtractor');
const { mapBlueprintToProjectUpdate } = require('../services/projectInitialization/blueprintPersistence');

const SAMPLE_PRD = fs.readFileSync(
    path.join(__dirname, 'fixtures/sample-shopflow-prd.txt'),
    'utf-8'
);

async function run() {
    console.log('=== Project Initialization Pipeline Test ===\n');

    // Step 1: Text extraction
    const extracted = extractPrdFromText(SAMPLE_PRD);
    console.log(`✓ PRD extracted: ${extracted.charCount} characters`);

    if (!process.env.GROQ_API_KEY) {
        console.log('⚠ GROQ_API_KEY not set — skipping AI extraction test');
        process.exit(0);
    }

    // Step 2: Blueprint extraction
    console.log('→ Running AI blueprint extraction (may take 15-30s)...');
    const { blueprint, validationWarnings } = await extractBlueprintFromPrd(extracted.text);
    console.log(`✓ Blueprint extracted`);
    console.log(`  - Requirements: ${blueprint.requirements.length}`);
    console.log(`  - Phases: ${blueprint.phases.length}`);
    console.log(`  - Tasks: ${blueprint.tasks.length}`);
    console.log(`  - Tech stack: ${blueprint.techStack.length}`);
    console.log(`  - Deadlines: ${blueprint.deadlines.length}`);
    console.log(`  - Deliverables: ${blueprint.deliverables.length}`);
    if (validationWarnings.length) {
        console.log(`  - Warnings: ${validationWarnings.join('; ')}`);
    }

    // Step 3: Persistence mapping
    const mapped = mapBlueprintToProjectUpdate(blueprint, {
        filename: 'sample-shopflow-prd.txt',
        charCount: extracted.charCount,
        textPreview: extracted.text.slice(0, 500)
    });
    console.log(`✓ Mapped to project fields`);
    console.log(`  - Kanban tasks: ${mapped.planning.milestones.length}`);
    console.log(`  - Reminders: ${mapped.reminders.length}`);
    console.log(`  - Tech stack: ${mapped.techStack.join(', ')}`);
    console.log(`  - Next step: ${mapped.nextPlannedStep}`);

    // Verify key extractions
    const techNames = mapped.techStack.map((t) => t.toLowerCase());
    const hasReact = techNames.some((t) => t.includes('react'));
    const hasMongo = techNames.some((t) => t.includes('mongo'));
    const hasStripe = techNames.some((t) => t.includes('stripe'));

    console.log('\n=== Verification ===');
    console.log(`React in tech stack: ${hasReact ? '✓' : '✗'}`);
    console.log(`MongoDB in tech stack: ${hasMongo ? '✓' : '✗'}`);
    console.log(`Stripe in tech stack: ${hasStripe ? '✓' : '✗'}`);
    console.log(`Reminders from explicit dates: ${mapped.reminders.length > 0 ? '✓' : '✗'} (${mapped.reminders.length})`);
    console.log(`Tasks derived from PRD: ${mapped.planning.milestones.length >= 5 ? '✓' : '✗'} (${mapped.planning.milestones.length})`);

    // Optional: full DB persistence test
    if (process.env.MONGODB_URI && process.argv.includes('--persist')) {
        await mongoose.connect(process.env.MONGODB_URI);
        const testUser = await User.findOne() || await User.create({ clerkId: 'test-init', displayName: 'Test' });
        const project = await Project.create({
            name: 'ShopFlow Test',
            userId: testUser._id,
            status: 'active'
        });

        await Project.findByIdAndUpdate(project._id, { $set: {
            ...mapped,
            initialization: { status: 'complete', completedAt: new Date() }
        }});

        const saved = await Project.findById(project._id);
        console.log(`\n✓ Persisted to MongoDB: ${saved._id}`);
        console.log(`  Brief clientRequirements length: ${saved.requirements?.clientRequirements?.length || 0}`);
        await Project.findByIdAndDelete(project._id);
        await mongoose.disconnect();
    }

    console.log('\n=== Test Complete ===');
}

run().catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
});
