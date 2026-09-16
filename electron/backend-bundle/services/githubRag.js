const GithubDocumentIndex = require('../models/GithubDocumentIndex');
const {
    isQdrantConfigured,
    deleteKnowledgeByFilter,
    upsertKnowledgePoints,
    getCollectionName
} = require('./qdrantService');
const {
    chunkText,
    buildQdrantPoints,
    hashContent
} = require('./ragService');
const { shouldIndexPath, EXCLUDED_DIR_PARTS, INCLUDE_EXTS } = require('./githubIndexPolicy');
const githubService = require('./githubService');
const {
    startIndexJob,
    updateIndexJob
} = require('./githubIndexJobs');

const MAX_INDEX_FILES = 80;

async function collectIndexableFiles(userId, owner, repo, dirPath, ref, acc) {
    if (acc.length >= MAX_INDEX_FILES) return acc;
    const tree = await githubService.listTree(userId, owner, repo, { path: dirPath, ref, refresh: true });
    for (const entry of tree.entries || []) {
        if (acc.length >= MAX_INDEX_FILES) break;
        if (entry.type === 'dir') {
            await collectIndexableFiles(userId, owner, repo, entry.path, ref, acc);
        } else if (entry.type === 'file' && shouldIndexPath(entry.path, entry.size)) {
            acc.push(entry);
        }
    }
    return acc;
}

async function indexGithubFile(userId, projectId, owner, repo, filePath, options = {}) {
    if (!isQdrantConfigured()) {
        return { indexed: false, reason: 'Qdrant is not configured (QDRANT_URL missing).' };
    }

    const { repo: linked } = await githubService.resolveProjectRepo(userId, projectId, owner, repo);
    const file = await githubService.getFile(userId, owner, repo, filePath, {
        ref: options.ref,
        refresh: true,
        projectId
    });

    if (file.binary || !file.content || file.content.length < 20) {
        return { indexed: false, reason: 'File is binary, empty, or too short.' };
    }

    const contentHash = hashContent(file.content);
    const existing = await GithubDocumentIndex.findOne({
        userId,
        projectId,
        repositoryId: linked.repositoryId,
        path: filePath
    });
    if (existing && existing.contentHash === contentHash && existing.status === 'indexed') {
        return { indexed: false, reason: 'File already indexed and unchanged.', path: filePath };
    }

    const textChunks = chunkText(file.content).map((text, i) => ({
        text,
        section: filePath,
        chunkIndex: i
    }));

    await deleteKnowledgeByFilter(userId, projectId, {
        sourceType: 'github',
        sourceDocumentId: `${linked.repositoryId}:${filePath}`
    });

    const { points, vectorSize } = await buildQdrantPoints(
        userId,
        projectId,
        'github',
        `${linked.repositoryId}:${filePath}`,
        textChunks,
        {
            fileName: filePath,
            webViewLink: file.htmlUrl || '',
            metadata: {
                repositoryId: linked.repositoryId,
                owner,
                repo,
                branch: options.ref || linked.defaultBranch || '',
                path: filePath,
                commitSha: file.commit?.sha || file.sha || '',
                language: file.language,
                contentHash
            }
        }
    );

    if (!points.length || !vectorSize) {
        return { indexed: false, reason: 'Failed to generate embeddings for GitHub file.' };
    }

    await upsertKnowledgePoints(points, vectorSize);

    await GithubDocumentIndex.findOneAndUpdate(
        { userId, projectId, repositoryId: linked.repositoryId, path: filePath },
        {
            owner,
            repo,
            branch: options.ref || linked.defaultBranch || '',
            commitSha: file.commit?.sha || file.sha || '',
            language: file.language,
            contentHash,
            chunkCount: points.length,
            indexedAt: new Date(),
            status: 'indexed',
            error: null
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return { indexed: true, chunkCount: points.length, path: filePath, collection: getCollectionName() };
}

async function indexGithubRepository(userId, projectId, owner, repo, options = {}) {
    console.log('[GitHub] RAG indexing started', `${owner}/${repo}`);
    if (!isQdrantConfigured()) {
        return { indexed: false, reason: 'Qdrant is not configured (QDRANT_URL missing).' };
    }

    const { repo: linked } = await githubService.resolveProjectRepo(userId, projectId, owner, repo);
    const ref = options.ref || linked.defaultBranch;
    const files = await collectIndexableFiles(userId, owner, repo, '', ref, []);
    updateIndexJob(userId, projectId, owner, repo, { fileCount: files.length });
    const results = [];
    let indexed = 0;
    let skipped = 0;

    for (const entry of files) {
        try {
            const result = await indexGithubFile(userId, projectId, owner, repo, entry.path, { ref });
            results.push(result);
            if (result.indexed) indexed += 1;
            else skipped += 1;
        } catch (error) {
            skipped += 1;
            results.push({ indexed: false, path: entry.path, reason: error.message });
        }
        updateIndexJob(userId, projectId, owner, repo, { indexedCount: indexed, skippedCount: skipped, fileCount: files.length });
    }

    console.log('[GitHub] RAG indexing completed', `${owner}/${repo}`, { indexed, skipped });
    return {
        indexed: indexed > 0,
        fileCount: files.length,
        indexedCount: indexed,
        skippedCount: skipped,
        results: results.slice(0, 40)
    };
}

module.exports = {
    shouldIndexPath,
    indexGithubFile,
    indexGithubRepository,
    EXCLUDED_DIR_PARTS,
    INCLUDE_EXTS
};
