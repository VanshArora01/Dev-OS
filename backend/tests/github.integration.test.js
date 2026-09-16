const assert = require('assert');
const { analyzeSourceFile, languageFromPath } = require('../services/githubAnalyzer');
const { inferTraceability, extractExplicitRefs } = require('../services/githubTraceability');
const { shouldIndexPath } = require('../services/githubIndexPolicy');
const { getGithubReadTools } = require('../services/githubToolDefinitions');
const { getAgentTools } = require('../services/toolRegistry');
const { mapGithubError } = require('../services/githubService');
const { cacheKey, getCached, setCached, invalidatePrefix } = require('../services/githubCache');

function testLanguageFromPath() {
    assert.strictEqual(languageFromPath('frontend/src/App.tsx'), 'tsx');
    assert.strictEqual(languageFromPath('backend/server.js'), 'javascript');
    console.log('PASS language from path');
}

function testJsImportParsing() {
    const source = `
import React from 'react';
import { useAIChat } from '@/hooks/useAIChat';
import { helper } from './helper';
export function AIPanel() {}
`;
    const result = analyzeSourceFile('frontend/src/components/AIPanel.tsx', source);
    assert(result.imports.includes('react'));
    assert(result.imports.includes('@/hooks/useAIChat'));
    assert(result.imports.includes('frontend/src/components/helper'));
    assert.strictEqual(result.status, 'analyzed');
    assert(result.exports.includes('AIPanel'));
    console.log('PASS JS/TS import parsing');
}

function testPythonImportParsing() {
    const source = `
from .auth import validate
import os
def connect():
    pass
`;
    const result = analyzeSourceFile('backend/db.py', source);
    assert(result.imports.includes('os'));
    assert.strictEqual(result.status, 'analyzed');
    console.log('PASS Python import parsing');
}

function testTraceabilityExplicit() {
    const refs = extractExplicitRefs('Implements FR-07 and closes #24');
    assert(refs.some((r) => String(r.value).toUpperCase().includes('FR-07')));
    const result = inferTraceability({
        title: 'Implement Drive indexing',
        body: 'Related to FR-07 Google Drive integration',
        files: ['ragService.js']
    }, {
        blueprint: { requirements: [{ id: 'FR-07', title: 'Google Drive integration' }] },
        planning: { milestones: [{ title: 'Implement Drive indexing', status: 'in-progress' }] }
    });
    assert(result.matches.length >= 1);
    assert(result.matches.some((m) => m.confidence === 'explicit' || m.kind === 'requirement'));
    console.log('PASS traceability matching');
}

function testUnsupportedAnalysis() {
    const result = analyzeSourceFile('logo.png', '');
    assert.strictEqual(result.status, 'unsupported');
    console.log('PASS unsupported analysis status');
}

function testIndexExclusions() {
    assert.strictEqual(shouldIndexPath('backend/server.js', 1000), true);
    assert.strictEqual(shouldIndexPath('frontend/src/App.tsx', 1000), true);
    assert.strictEqual(shouldIndexPath('node_modules/react/index.js', 1000), false);
    assert.strictEqual(shouldIndexPath('dist/bundle.js', 1000), false);
    assert.strictEqual(shouldIndexPath('logo.png', 1000), false);
    console.log('PASS RAG exclusion strategy');
}

function testGithubToolsRegistered() {
    const tools = getGithubReadTools();
    const names = tools.map((t) => t.function.name);
    [
        'github_list_repositories',
        'github_get_repository',
        'github_list_files',
        'github_get_file',
        'github_get_file_history',
        'github_list_commits',
        'github_get_commit',
        'github_list_pull_requests',
        'github_get_pull_request',
        'github_list_branches',
        'github_list_issues',
        'github_search_code'
    ].forEach((name) => assert(names.includes(name), `missing ${name}`));
    const withoutGithub = getAgentTools({ driveConnected: false, githubConnected: false, profile: 'full' });
    const withGithub = getAgentTools({ driveConnected: false, githubConnected: true, profile: 'github_read' });
    assert.strictEqual(withoutGithub.length, 8);
    assert(withGithub.some((t) => t.function.name === 'github_get_file'));
    assert(!withoutGithub.some((t) => t.function.name === 'github_get_file'));
    console.log('PASS GitHub tool registry');
}

function testErrorMapping() {
    assert.strictEqual(mapGithubError({}, 401).code, 'GITHUB_UNAUTHORIZED');
    assert.strictEqual(mapGithubError({}, 403).code, 'GITHUB_FORBIDDEN');
    assert.strictEqual(mapGithubError({}, 404).code, 'GITHUB_NOT_FOUND');
    assert.strictEqual(mapGithubError({}, 429).code, 'GITHUB_RATE_LIMITED');
    console.log('PASS GitHub error mapping');
}

function testCache() {
    const key = cacheKey(['tree', 'u1', 'owner', 'repo']);
    setCached(key, { ok: true }, 50);
    assert.deepStrictEqual(getCached(key).value, { ok: true });
    invalidatePrefix('tree::u1');
    assert.strictEqual(getCached(key), null);
    console.log('PASS GitHub cache');
}

testLanguageFromPath();
testJsImportParsing();
testPythonImportParsing();
testUnsupportedAnalysis();
testTraceabilityExplicit();
testIndexExclusions();
testGithubToolsRegistered();
testErrorMapping();
testCache();
console.log('All GitHub unit checks passed.');
