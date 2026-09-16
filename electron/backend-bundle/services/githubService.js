const path = require('path');
const Project = require('../models/Project');
const GithubFileRelation = require('../models/GithubFileRelation');
const {
    getValidAccessToken,
    getGithubIntegrationForUser,
    githubRequest,
    getInstallations,
    getInstallationRepositories,
    markGithubRevoked,
    getInstallUrl
} = require('./githubOAuthService');
const { cacheKey, getCached, setCached, invalidatePrefix } = require('./githubCache');
const { analyzeSourceFile, languageFromPath } = require('./githubAnalyzer');
const { inferTraceability } = require('./githubTraceability');

const REPO_TTL = 60 * 1000;
const TREE_TTL = 30 * 1000;
const LIST_TTL = 30 * 1000;
const FILE_TTL = 20 * 1000;
const MAX_FILE_BYTES = 512 * 1024;
const MAX_PATCH_CHARS = 20000;

const BINARY_EXTS = new Set([
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.pdf', '.zip', '.gz',
    '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.mp3', '.exe', '.dll', '.so',
    '.bin', '.wasm', '.lock'
]);

function mapGithubError(error, status) {
    const codeFromStatus = {
        401: 'GITHUB_UNAUTHORIZED',
        403: 'GITHUB_FORBIDDEN',
        404: 'GITHUB_NOT_FOUND',
        409: 'GITHUB_CONFLICT',
        422: 'GITHUB_UNPROCESSABLE',
        429: 'GITHUB_RATE_LIMITED'
    };
    const messageFromStatus = {
        401: 'GitHub authorization is invalid. Reconnect GitHub from Settings.',
        403: 'GitHub denied this request. The App may lack permission or hit a rate limit.',
        404: 'GitHub resource was not found or is not accessible to this installation.',
        429: 'GitHub rate limit reached. Wait and retry.'
    };

    if (error?.code && error.message) return error;

    const mapped = {
        code: error?.code || codeFromStatus[status] || 'GITHUB_ERROR',
        message: error?.message || messageFromStatus[status] || 'GitHub request failed.',
        status: status || null,
        retryable: status === 429 || status >= 500
    };
    return mapped;
}

function normalizeRepository(repo) {
    if (!repo) return null;
    return {
        id: String(repo.id),
        owner: repo.owner?.login || repo.full_name?.split('/')[0] || '',
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description || '',
        private: Boolean(repo.private),
        defaultBranch: repo.default_branch || 'main',
        htmlUrl: repo.html_url,
        language: repo.language || '',
        updatedAt: repo.updated_at || null,
        pushedAt: repo.pushed_at || null,
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0
    };
}

function isProbablyBinary(filePath, encoding, size) {
    const ext = path.posix.extname(filePath || '').toLowerCase();
    if (BINARY_EXTS.has(ext)) return true;
    if (encoding && encoding !== 'base64' && encoding !== 'utf-8' && encoding !== 'none') return true;
    if (size && size > MAX_FILE_BYTES * 4) return true;
    return false;
}

async function apiGet(accessToken, url, params, userId) {
    console.log('[GitHub] API request', url);
    const response = await githubRequest(accessToken, 'GET', url, { params });
    if (response.status === 401 && userId) {
        await markGithubRevoked(userId, 'GitHub returned 401. Reconnect required.');
    }
    if (response.status >= 400) {
        const ghMessage = response.data?.message || `GitHub API ${response.status}`;
        const error = new Error(ghMessage);
        Object.assign(error, mapGithubError(error, response.status));
        if (response.status === 403 && response.headers?.['x-ratelimit-remaining'] === '0') {
            error.code = 'GITHUB_RATE_LIMITED';
            error.message = 'GitHub rate limit reached. Wait and retry.';
            error.retryable = true;
        }
        console.warn('[GitHub] API error', error.code, url);
        throw error;
    }
    return response.data;
}

async function getStatus(userId) {
    const integration = await getGithubIntegrationForUser(userId);
    if (!integration) {
        return {
            connected: false,
            provider: 'github',
            status: 'disconnected',
            username: null,
            avatarUrl: null,
            installationId: null,
            repositoryCount: 0,
            installUrl: getInstallUrl()
        };
    }

    try {
        const { accessToken } = await getValidAccessToken(userId);
        const installations = await getInstallations(accessToken);
        const installation = installations[0] || null;
        let repositoryCount = installation?.repository_selection === 'all' ? null : 0;
        if (installation?.id) {
            const repos = await getInstallationRepositories(accessToken, installation.id);
            repositoryCount = repos.length;
        }
        return {
            connected: true,
            provider: 'github',
            status: integration.status,
            username: integration.metadata?.login || integration.accountEmail,
            avatarUrl: integration.metadata?.avatarUrl || null,
            installationId: installation?.id ? String(installation.id) : integration.metadata?.installationId || null,
            installationAccount: installation?.account?.login || integration.metadata?.installationAccount || null,
            repositoryCount,
            connectedAt: integration.updatedAt,
            needsInstall: !installation
        };
    } catch (error) {
        return {
            connected: false,
            provider: 'github',
            status: error.code === 'GITHUB_RECONNECT_REQUIRED' ? 'revoked' : 'error',
            username: integration.metadata?.login || integration.accountEmail,
            avatarUrl: integration.metadata?.avatarUrl || null,
            error: mapGithubError(error).message
        };
    }
}

async function listAccessibleRepositories(userId, { search = '', refresh = false } = {}) {
    const { accessToken } = await getValidAccessToken(userId);
    const key = cacheKey(['repos', String(userId)]);
    let repos = (!refresh && getCached(key)?.value) || null;

    if (!repos) {
        const installations = await getInstallations(accessToken);
        const collected = [];
        for (const installation of installations) {
            const batch = await getInstallationRepositories(accessToken, installation.id);
            collected.push(...batch.map(normalizeRepository));
        }
        if (!collected.length) {
            const data = await apiGet(accessToken, '/user/repos', {
                per_page: 100,
                sort: 'updated',
                affiliation: 'owner,collaborator,organization_member'
            }, userId);
            collected.push(...(data || []).map(normalizeRepository));
        }
        repos = collected;
        setCached(key, repos, REPO_TTL);
        console.log('[GitHub] Repository fetched', repos.length);
    }

    const query = String(search || '').trim().toLowerCase();
    const filtered = query
        ? repos.filter((repo) =>
            repo.fullName.toLowerCase().includes(query)
            || (repo.description || '').toLowerCase().includes(query))
        : repos;

    return { repositories: filtered, stale: false };
}

async function getRepository(userId, owner, repo, refresh = false) {
    const { accessToken } = await getValidAccessToken(userId);
    const key = cacheKey(['repo', String(userId), owner, repo]);
    if (!refresh) {
        const cached = getCached(key);
        if (cached) return cached.value;
    }
    const data = await apiGet(accessToken, `/repos/${owner}/${repo}`, {}, userId);
    const normalized = normalizeRepository(data);
    setCached(key, normalized, REPO_TTL);
    return normalized;
}

async function requireOwnedProject(userId, projectId) {
    const project = await Project.findOne({ _id: projectId, userId });
    if (!project) {
        const error = new Error('Project not found.');
        error.code = 'PROJECT_NOT_FOUND';
        throw error;
    }
    return project;
}

function getLinkedRepos(project) {
    return project.githubRepositories || [];
}

function findLinkedRepo(project, owner, repo) {
    return getLinkedRepos(project).find((item) =>
        item.owner.toLowerCase() === String(owner).toLowerCase()
        && item.name.toLowerCase() === String(repo).toLowerCase()
    );
}

async function resolveProjectRepo(userId, projectId, owner, repo) {
    const project = await requireOwnedProject(userId, projectId);
    const linked = getLinkedRepos(project);
    if (owner && repo) {
        const match = findLinkedRepo(project, owner, repo);
        if (!match) {
            const error = new Error('This repository is not connected to the current DevOS project.');
            error.code = 'REPO_NOT_LINKED';
            throw error;
        }
        return { project, repo: match };
    }
    if (!linked.length) {
        const error = new Error('No GitHub repository is connected to this project yet.');
        error.code = 'REPO_NOT_LINKED';
        throw error;
    }
    return { project, repo: linked[0] };
}

async function connectRepositoryToProject(userId, projectId, owner, repo) {
    const project = await requireOwnedProject(userId, projectId);
    const details = await getRepository(userId, owner, repo, true);
    const existing = findLinkedRepo(project, details.owner, details.name);
    if (existing) {
        return { project, repository: existing, alreadyConnected: true };
    }
    const record = {
        repositoryId: details.id,
        owner: details.owner,
        name: details.name,
        fullName: details.fullName,
        description: details.description,
        private: details.private,
        defaultBranch: details.defaultBranch,
        htmlUrl: details.htmlUrl,
        language: details.language,
        connectedAt: new Date()
    };
    project.githubRepositories = [...getLinkedRepos(project), record];
    if (!project.repoUrl) project.repoUrl = details.htmlUrl;
    await project.save();
    return { project, repository: record, alreadyConnected: false };
}

async function disconnectRepositoryFromProject(userId, projectId, owner, repo) {
    const project = await requireOwnedProject(userId, projectId);
    project.githubRepositories = getLinkedRepos(project).filter((item) =>
        !(item.owner.toLowerCase() === owner.toLowerCase() && item.name.toLowerCase() === repo.toLowerCase())
    );
    await project.save();
    return { project, repositories: project.githubRepositories };
}

async function listProjectRepositories(userId, projectId) {
    const project = await requireOwnedProject(userId, projectId);
    return { repositories: getLinkedRepos(project) };
}

async function listTree(userId, owner, repo, { path: dirPath = '', ref, refresh = false, projectId } = {}) {
    if (projectId) await resolveProjectRepo(userId, projectId, owner, repo);
    const { accessToken } = await getValidAccessToken(userId);
    const key = cacheKey(['tree', String(userId), owner, repo, dirPath, ref || 'default']);
    if (!refresh) {
        const cached = getCached(key);
        if (cached) return { ...cached.value, stale: false };
    }
    const encodedPath = dirPath ? `/${dirPath.split('/').map(encodeURIComponent).join('/')}` : '';
    const data = await apiGet(accessToken, `/repos/${owner}/${repo}/contents${encodedPath}`, ref ? { ref } : {}, userId);
    const entries = (Array.isArray(data) ? data : [data]).filter(Boolean).map((item) => ({
        name: item.name,
        path: item.path,
        type: item.type,
        sha: item.sha,
        size: item.size || 0,
        htmlUrl: item.html_url,
        downloadUrl: item.download_url || null
    })).sort((a, b) => {
        if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
        return a.name.localeCompare(b.name);
    });
    const payload = {
        path: dirPath || '',
        ref: ref || null,
        entries
    };
    setCached(key, payload, TREE_TTL);
    return payload;
}

function decodeFileContent(data) {
    if (!data?.content) return '';
    if (data.encoding === 'base64') {
        return Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8');
    }
    return String(data.content);
}

async function resolveMissingExtension(accessToken, owner, repo, filePath, ref, userId) {
    const ext = path.posix.extname(filePath || '');
    if (ext) return null;
    const parent = path.posix.dirname(filePath);
    const base = path.posix.basename(filePath);
    if (!base) return null;
    const dirPath = parent === '.' ? '' : parent;
    const encodedDir = dirPath.split('/').filter(Boolean).map(encodeURIComponent).join('/');
    try {
        const listing = await apiGet(
            accessToken,
            `/repos/${owner}/${repo}/contents/${encodedDir}`,
            ref ? { ref } : {},
            userId
        );
        const entries = Array.isArray(listing) ? listing : [];
        const match = entries.find((entry) => {
            if (entry.type !== 'file') return false;
            const name = entry.name || '';
            return name === base || name.startsWith(`${base}.`);
        });
        return match?.path || null;
    } catch {
        const guesses = ['.tsx', '.ts', '.jsx', '.js', '.md'];
        for (const guess of guesses) {
            const candidate = `${filePath}${guess}`;
            const encoded = candidate.split('/').map(encodeURIComponent).join('/');
            try {
                await apiGet(accessToken, `/repos/${owner}/${repo}/contents/${encoded}`, ref ? { ref } : {}, userId);
                return candidate;
            } catch {
                /* try next */
            }
        }
        return null;
    }
}

async function getFile(userId, owner, repo, filePath, { ref, refresh = false, projectId, skipResolve = false } = {}) {
    if (projectId) await resolveProjectRepo(userId, projectId, owner, repo);
    const { accessToken } = await getValidAccessToken(userId);
    const key = cacheKey(['file', String(userId), owner, repo, filePath, ref || 'default']);
    if (!refresh) {
        const cached = getCached(key);
        if (cached) return cached.value;
    }

    const encodedPath = filePath.split('/').map(encodeURIComponent).join('/');
    let data;
    try {
        data = await apiGet(accessToken, `/repos/${owner}/${repo}/contents/${encodedPath}`, ref ? { ref } : {}, userId);
    } catch (error) {
        if (!skipResolve && (error.status === 404 || error.code === 'GITHUB_NOT_FOUND')) {
            const resolved = await resolveMissingExtension(accessToken, owner, repo, filePath, ref, userId);
            if (resolved && resolved !== filePath) {
                return getFile(userId, owner, repo, resolved, { ref, refresh, projectId, skipResolve: true });
            }
        }
        throw error;
    }

    if (Array.isArray(data) || data.type === 'dir') {
        const error = new Error('Path is a directory, not a file.');
        error.code = 'NOT_A_FILE';
        throw error;
    }

    const binary = isProbablyBinary(filePath, data.encoding, data.size);
    const tooLarge = (data.size || 0) > MAX_FILE_BYTES;
    let content = null;
    let truncated = false;

    if (!binary && !tooLarge) {
        content = decodeFileContent(data);
        if (content.length > MAX_FILE_BYTES) {
            content = content.slice(0, MAX_FILE_BYTES);
            truncated = true;
        }
    }

    let commit = null;
    try {
        const commits = await apiGet(accessToken, `/repos/${owner}/${repo}/commits`, {
            path: filePath,
            per_page: 1,
            sha: ref
        }, userId);
        if (commits?.[0]) {
            commit = {
                sha: commits[0].sha,
                message: commits[0].commit?.message || '',
                author: commits[0].commit?.author?.name || commits[0].author?.login || '',
                date: commits[0].commit?.author?.date || null,
                htmlUrl: commits[0].html_url
            };
        }
    } catch (error) {
        commit = null;
    }

    const payload = {
        name: data.name,
        path: data.path,
        sha: data.sha,
        size: data.size || 0,
        language: languageFromPath(filePath),
        htmlUrl: data.html_url,
        encoding: data.encoding,
        binary,
        tooLarge,
        truncated,
        content,
        commit,
        ref: ref || null
    };
    setCached(key, payload, FILE_TTL);
    console.log('[GitHub] File fetched', data.path);
    return payload;
}

async function listCommits(userId, owner, repo, { sha, path: filePath, perPage = 30, refresh = false, projectId } = {}) {
    if (projectId) await resolveProjectRepo(userId, projectId, owner, repo);
    const { accessToken } = await getValidAccessToken(userId);
    const key = cacheKey(['commits', String(userId), owner, repo, sha || '', filePath || '']);
    if (!refresh) {
        const cached = getCached(key);
        if (cached) return cached.value;
    }
    const data = await apiGet(accessToken, `/repos/${owner}/${repo}/commits`, {
        sha,
        path: filePath,
        per_page: Math.min(Number(perPage) || 30, 50)
    }, userId);
    const commits = (data || []).map((item) => ({
        sha: item.sha,
        shortSha: item.sha?.slice(0, 7),
        message: item.commit?.message || '',
        author: item.commit?.author?.name || item.author?.login || '',
        authorLogin: item.author?.login || null,
        date: item.commit?.author?.date || null,
        htmlUrl: item.html_url,
        stats: item.stats || null
    }));
    const payload = { commits };
    setCached(key, payload, LIST_TTL);
    console.log('[GitHub] Commit fetched', commits.length);
    return payload;
}

async function getCommit(userId, owner, repo, sha, { projectId } = {}) {
    const { project } = projectId
        ? await resolveProjectRepo(userId, projectId, owner, repo)
        : { project: null };
    const { accessToken } = await getValidAccessToken(userId);
    const data = await apiGet(accessToken, `/repos/${owner}/${repo}/commits/${sha}`, {}, userId);
    const files = (data.files || []).map((file) => ({
        filename: file.filename,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        changes: file.changes,
        patch: file.patch ? String(file.patch).slice(0, MAX_PATCH_CHARS) : null,
        truncatedPatch: Boolean(file.patch && file.patch.length > MAX_PATCH_CHARS)
    }));
    const commit = {
        sha: data.sha,
        message: data.commit?.message || '',
        author: data.commit?.author?.name || data.author?.login || '',
        authorLogin: data.author?.login || null,
        date: data.commit?.author?.date || null,
        htmlUrl: data.html_url,
        stats: data.stats || { additions: 0, deletions: 0, total: 0 },
        files
    };
    console.log('[GitHub] Commit fetched', sha);
    return {
        commit,
        traceability: project ? inferTraceability({
            message: commit.message,
            files: files.map((f) => f.filename)
        }, project) : { matches: [] }
    };
}

async function listPullRequests(userId, owner, repo, { state = 'all', perPage = 30, refresh = false, projectId } = {}) {
    if (projectId) await resolveProjectRepo(userId, projectId, owner, repo);
    const { accessToken } = await getValidAccessToken(userId);
    const key = cacheKey(['pulls', String(userId), owner, repo, state]);
    if (!refresh) {
        const cached = getCached(key);
        if (cached) return cached.value;
    }
    const data = await apiGet(accessToken, `/repos/${owner}/${repo}/pulls`, {
        state,
        per_page: Math.min(Number(perPage) || 30, 50),
        sort: 'updated',
        direction: 'desc'
    }, userId);
    const pullRequests = (data || []).map((item) => ({
        number: item.number,
        title: item.title,
        state: item.merged_at ? 'merged' : item.state,
        draft: Boolean(item.draft),
        author: item.user?.login || '',
        labels: (item.labels || []).map((label) => label.name),
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        mergedAt: item.merged_at,
        htmlUrl: item.html_url,
        head: item.head?.ref,
        base: item.base?.ref
    }));
    const payload = { pullRequests };
    setCached(key, payload, LIST_TTL);
    console.log('[GitHub] PR fetched', pullRequests.length);
    return payload;
}

async function getPullRequest(userId, owner, repo, number, { projectId } = {}) {
    const { project } = projectId
        ? await resolveProjectRepo(userId, projectId, owner, repo)
        : { project: null };
    const { accessToken } = await getValidAccessToken(userId);
    const data = await apiGet(accessToken, `/repos/${owner}/${repo}/pulls/${number}`, {}, userId);
    let files = [];
    let commits = [];
    try {
        files = await apiGet(accessToken, `/repos/${owner}/${repo}/pulls/${number}/files`, { per_page: 100 }, userId);
    } catch (error) {
        files = [];
    }
    try {
        commits = await apiGet(accessToken, `/repos/${owner}/${repo}/pulls/${number}/commits`, { per_page: 50 }, userId);
    } catch (error) {
        commits = [];
    }

    const pullRequest = {
        number: data.number,
        title: data.title,
        body: data.body || '',
        state: data.merged_at ? 'merged' : data.state,
        mergeable: data.mergeable,
        merged: Boolean(data.merged),
        draft: Boolean(data.draft),
        author: data.user?.login || '',
        reviewers: (data.requested_reviewers || []).map((user) => user.login),
        labels: (data.labels || []).map((label) => label.name),
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        mergedAt: data.merged_at,
        htmlUrl: data.html_url,
        head: data.head?.ref,
        base: data.base?.ref,
        additions: data.additions,
        deletions: data.deletions,
        changedFiles: data.changed_files,
        files: (files || []).map((file) => ({
            filename: file.filename,
            status: file.status,
            additions: file.additions,
            deletions: file.deletions,
            patch: file.patch ? String(file.patch).slice(0, MAX_PATCH_CHARS) : null
        })),
        commits: (commits || []).map((item) => ({
            sha: item.sha,
            message: item.commit?.message || '',
            author: item.commit?.author?.name || item.author?.login || '',
            date: item.commit?.author?.date || null
        }))
    };
    console.log('[GitHub] PR fetched', number);
    return {
        pullRequest,
        traceability: project ? inferTraceability({
            title: pullRequest.title,
            body: pullRequest.body,
            branch: pullRequest.head,
            files: pullRequest.files.map((f) => f.filename)
        }, project) : { matches: [] }
    };
}

async function listBranches(userId, owner, repo, { refresh = false, projectId } = {}) {
    if (projectId) await resolveProjectRepo(userId, projectId, owner, repo);
    const { accessToken } = await getValidAccessToken(userId);
    const key = cacheKey(['branches', String(userId), owner, repo]);
    if (!refresh) {
        const cached = getCached(key);
        if (cached) return cached.value;
    }
    const repoInfo = await getRepository(userId, owner, repo, refresh);
    const data = await apiGet(accessToken, `/repos/${owner}/${repo}/branches`, { per_page: 100 }, userId);
    const branches = (data || []).map((item) => ({
        name: item.name,
        sha: item.commit?.sha,
        protected: Boolean(item.protected),
        isDefault: item.name === repoInfo.defaultBranch
    }));
    const payload = { defaultBranch: repoInfo.defaultBranch, branches };
    setCached(key, payload, LIST_TTL);
    return payload;
}

async function listIssues(userId, owner, repo, { state = 'all', refresh = false, projectId } = {}) {
    if (projectId) await resolveProjectRepo(userId, projectId, owner, repo);
    const { accessToken } = await getValidAccessToken(userId);
    const key = cacheKey(['issues', String(userId), owner, repo, state]);
    if (!refresh) {
        const cached = getCached(key);
        if (cached) return cached.value;
    }
    const data = await apiGet(accessToken, `/repos/${owner}/${repo}/issues`, {
        state,
        per_page: 30
    }, userId);
    const issues = (data || [])
        .filter((item) => !item.pull_request)
        .map((item) => ({
            number: item.number,
            title: item.title,
            state: item.state,
            author: item.user?.login || '',
            assignees: (item.assignees || []).map((user) => user.login),
            labels: (item.labels || []).map((label) => label.name || label),
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            closedAt: item.closed_at,
            htmlUrl: item.html_url
        }));
    const payload = { issues };
    setCached(key, payload, LIST_TTL);
    return payload;
}

async function searchCode(userId, owner, repo, query, { projectId } = {}) {
    if (projectId) await resolveProjectRepo(userId, projectId, owner, repo);
    const { accessToken } = await getValidAccessToken(userId);
    const q = `${query} repo:${owner}/${repo}`;
    const data = await apiGet(accessToken, '/search/code', { q, per_page: 20 }, userId);
    return {
        total: data.total_count || 0,
        items: (data.items || []).map((item) => ({
            name: item.name,
            path: item.path,
            sha: item.sha,
            htmlUrl: item.html_url
        }))
    };
}

async function getFileHistory(userId, owner, repo, filePath, { projectId } = {}) {
    return listCommits(userId, owner, repo, { path: filePath, perPage: 20, projectId });
}

async function getCoChangedPaths(userId, owner, repo, filePath, { projectId, exclude = [] } = {}) {
    const excludeSet = new Set([filePath, ...exclude]);
    const history = await listCommits(userId, owner, repo, { path: filePath, perPage: 12, projectId });
    const counts = new Map();
    for (const commit of (history.commits || []).slice(0, 8)) {
        try {
            const detail = await getCommit(userId, owner, repo, commit.sha, { projectId });
            (detail.commit?.files || []).forEach((file) => {
                if (!file.filename || excludeSet.has(file.filename)) return;
                counts.set(file.filename, (counts.get(file.filename) || 0) + 1);
            });
        } catch (error) {
            // skip individual commit failures
        }
    }
    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12)
        .map(([path, count]) => ({ path, coChangeCount: count }));
}

async function analyzeFileRelationships(userId, projectId, owner, repo, filePath, content) {
    const analysis = analyzeSourceFile(filePath, content || '');
    if (!projectId) return analysis;
    const { repo: linked } = await resolveProjectRepo(userId, projectId, owner, repo);
    await GithubFileRelation.findOneAndUpdate(
        {
            userId,
            projectId,
            repositoryId: linked.repositoryId,
            path: filePath
        },
        {
            owner,
            repo,
            language: analysis.language,
            imports: analysis.imports,
            exports: analysis.exports,
            relatedPaths: [],
            analyzedAt: new Date()
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const usedByDocs = await GithubFileRelation.find({
        userId,
        projectId,
        repositoryId: linked.repositoryId,
        imports: filePath
    }).select('path').lean();

    const usedBy = usedByDocs.map((doc) => doc.path);
    let relatedPaths = [];
    try {
        relatedPaths = await getCoChangedPaths(userId, owner, repo, filePath, {
            projectId,
            exclude: [...analysis.imports, ...usedBy]
        });
    } catch (error) {
        relatedPaths = [];
    }

    return {
        ...analysis,
        usedBy,
        relatedPaths
    };
}

function invalidateRepoCache(userId, owner, repo) {
    invalidatePrefix(cacheKey(['tree', String(userId), owner, repo]));
    invalidatePrefix(cacheKey(['file', String(userId), owner, repo]));
    invalidatePrefix(cacheKey(['commits', String(userId), owner, repo]));
    invalidatePrefix(cacheKey(['pulls', String(userId), owner, repo]));
    invalidatePrefix(cacheKey(['branches', String(userId), owner, repo]));
    invalidatePrefix(cacheKey(['issues', String(userId), owner, repo]));
    invalidatePrefix(cacheKey(['repo', String(userId), owner, repo]));
    invalidatePrefix(cacheKey(['repos', String(userId)]));
}

module.exports = {
    mapGithubError,
    getStatus,
    listAccessibleRepositories,
    getRepository,
    connectRepositoryToProject,
    disconnectRepositoryFromProject,
    listProjectRepositories,
    resolveProjectRepo,
    listTree,
    getFile,
    listCommits,
    getCommit,
    listPullRequests,
    getPullRequest,
    listBranches,
    listIssues,
    searchCode,
    getFileHistory,
    analyzeFileRelationships,
    getCoChangedPaths,
    invalidateRepoCache,
    MAX_FILE_BYTES
};
