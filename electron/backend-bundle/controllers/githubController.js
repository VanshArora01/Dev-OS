const {
    createAuthUrl,
    validateAndConsumeState,
    exchangeCodeForTokens,
    getGithubIdentity,
    getInstallations,
    saveIntegration,
    disconnectGithubIntegration,
    getInstallUrl
} = require('../services/githubOAuthService');
const githubService = require('../services/githubService');
const { indexGithubRepository } = require('../services/githubRag');
const { startIndexJob, getIndexJob, updateIndexJob, publicIndexJob } = require('../services/githubIndexJobs');
const { getClerkIdFromRequest } = require('../utils/auth');
const { getFrontendUrl } = require('../services/githubConfig');

const SETTINGS_URL = `${getFrontendUrl()}/#/settings`;

function sendGithubError(res, error) {
    const mapped = githubService.mapGithubError(error, error.status);
    const status = error.status && error.status < 500 ? error.status : 400;
    const codeStatus = {
        GITHUB_NOT_CONNECTED: 400,
        GITHUB_RECONNECT_REQUIRED: 401,
        GITHUB_UNAUTHORIZED: 401,
        GITHUB_FORBIDDEN: 403,
        GITHUB_NOT_FOUND: 404,
        GITHUB_RATE_LIMITED: 429,
        PROJECT_NOT_FOUND: 404,
        REPO_NOT_LINKED: 403,
        NOT_A_FILE: 400
    };
    res.status(codeStatus[mapped.code] || status).json({
        error: mapped.message,
        code: mapped.code,
        retryable: mapped.retryable
    });
}

exports.connectGithub = async (req, res) => {
    try {
        const authUrl = await createAuthUrl(req.userId, req.clerkId);
        res.redirect(authUrl);
    } catch (error) {
        console.error('[GitHub] connect error:', error.message);
        res.redirect(`${SETTINGS_URL}?github_error=${encodeURIComponent(error.message)}`);
    }
};

exports.githubCallback = async (req, res) => {
    try {
        const { code, state, error, installation_id: installationId } = req.query;
        console.log('[GitHub] Callback received');

        if (error) {
            return res.redirect(`${SETTINGS_URL}?github_error=${encodeURIComponent('GitHub authorization was denied.')}`);
        }
        if (!code) {
            return res.redirect(`${SETTINGS_URL}?github_error=${encodeURIComponent('Missing authorization code.')}`);
        }

        const stateRecord = await validateAndConsumeState(state);
        const tokens = await exchangeCodeForTokens(code);
        const identity = await getGithubIdentity(tokens.access_token);
        const installations = await getInstallations(tokens.access_token);
        const installation = installations.find((item) => String(item.id) === String(installationId))
            || installations[0]
            || null;

        await saveIntegration(stateRecord.userId, stateRecord.clerkId, tokens, identity, installation);

        if (!installation) {
            return res.redirect(`${SETTINGS_URL}?github_connected=1&github_needs_install=1`);
        }

        res.redirect(`${SETTINGS_URL}?github_connected=1`);
    } catch (callbackError) {
        console.error('[GitHub] callback error:', callbackError.message);
        res.redirect(`${SETTINGS_URL}?github_error=${encodeURIComponent(callbackError.message)}`);
    }
};

exports.getConnectUrl = async (req, res) => {
    try {
        const clerkId = getClerkIdFromRequest(req);
        if (!clerkId) return res.status(401).json({ error: 'Unauthorized' });
        const baseUrl = process.env.BACKEND_URL || 'http://127.0.0.1:5000';
        res.json({
            connectUrl: `${baseUrl}/api/integrations/github/connect?clerkId=${encodeURIComponent(clerkId)}`,
            installUrl: getInstallUrl()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getStatus = async (req, res) => {
    try {
        const status = await githubService.getStatus(req.userId);
        res.json(status);
    } catch (error) {
        sendGithubError(res, error);
    }
};

exports.disconnectGithub = async (req, res) => {
    try {
        await disconnectGithubIntegration(req.userId);
        res.json({ success: true, message: 'GitHub disconnected.' });
    } catch (error) {
        sendGithubError(res, error);
    }
};

exports.listRepositories = async (req, res) => {
    try {
        const result = await githubService.listAccessibleRepositories(req.userId, {
            search: req.query.search,
            refresh: req.query.refresh === '1'
        });
        res.json(result);
    } catch (error) {
        sendGithubError(res, error);
    }
};

exports.getRepository = async (req, res) => {
    try {
        const repo = await githubService.getRepository(req.userId, req.params.owner, req.params.repo, req.query.refresh === '1');
        res.json({ repository: repo });
    } catch (error) {
        sendGithubError(res, error);
    }
};

exports.listProjectRepositories = async (req, res) => {
    try {
        const result = await githubService.listProjectRepositories(req.userId, req.params.projectId);
        res.json(result);
    } catch (error) {
        sendGithubError(res, error);
    }
};

exports.connectProjectRepository = async (req, res) => {
    try {
        const { owner, repo } = req.body;
        if (!owner || !repo) {
            return res.status(400).json({ error: 'owner and repo are required.' });
        }
        const result = await githubService.connectRepositoryToProject(req.userId, req.params.projectId, owner, repo);
        res.json({
            success: true,
            repository: result.repository,
            alreadyConnected: result.alreadyConnected
        });
    } catch (error) {
        sendGithubError(res, error);
    }
};

exports.disconnectProjectRepository = async (req, res) => {
    try {
        const result = await githubService.disconnectRepositoryFromProject(
            req.userId,
            req.params.projectId,
            req.params.owner,
            req.params.repo
        );
        res.json({ success: true, repositories: result.repositories });
    } catch (error) {
        sendGithubError(res, error);
    }
};

function repoArgs(req) {
    return {
        projectId: req.query.projectId,
        refresh: req.query.refresh === '1',
        ref: req.query.ref || req.query.branch || undefined
    };
}

exports.listTree = async (req, res) => {
    try {
        const result = await githubService.listTree(req.userId, req.params.owner, req.params.repo, {
            path: req.query.path || '',
            ...repoArgs(req)
        });
        res.json(result);
    } catch (error) {
        sendGithubError(res, error);
    }
};

exports.getFile = async (req, res) => {
    try {
        const filePath = req.query.path;
        if (!filePath) return res.status(400).json({ error: 'path is required.' });
        const file = await githubService.getFile(req.userId, req.params.owner, req.params.repo, filePath, repoArgs(req));
        let relationships = null;
        if (!file.binary && file.content && req.query.projectId) {
            relationships = await githubService.analyzeFileRelationships(
                req.userId,
                req.query.projectId,
                req.params.owner,
                req.params.repo,
                filePath,
                file.content
            );
        }
        res.json({ file, relationships });
    } catch (error) {
        sendGithubError(res, error);
    }
};

exports.listCommits = async (req, res) => {
    try {
        const result = await githubService.listCommits(req.userId, req.params.owner, req.params.repo, {
            sha: req.query.sha,
            path: req.query.path,
            perPage: req.query.perPage,
            ...repoArgs(req)
        });
        res.json(result);
    } catch (error) {
        sendGithubError(res, error);
    }
};

exports.getCommit = async (req, res) => {
    try {
        const result = await githubService.getCommit(
            req.userId,
            req.params.owner,
            req.params.repo,
            req.params.sha,
            { projectId: req.query.projectId }
        );
        res.json(result);
    } catch (error) {
        sendGithubError(res, error);
    }
};

exports.listPulls = async (req, res) => {
    try {
        const result = await githubService.listPullRequests(req.userId, req.params.owner, req.params.repo, {
            state: req.query.state || 'all',
            ...repoArgs(req)
        });
        res.json(result);
    } catch (error) {
        sendGithubError(res, error);
    }
};

exports.getPull = async (req, res) => {
    try {
        const result = await githubService.getPullRequest(
            req.userId,
            req.params.owner,
            req.params.repo,
            req.params.number,
            { projectId: req.query.projectId }
        );
        res.json(result);
    } catch (error) {
        sendGithubError(res, error);
    }
};

exports.listBranches = async (req, res) => {
    try {
        const result = await githubService.listBranches(req.userId, req.params.owner, req.params.repo, repoArgs(req));
        res.json(result);
    } catch (error) {
        sendGithubError(res, error);
    }
};

exports.listIssues = async (req, res) => {
    try {
        const result = await githubService.listIssues(req.userId, req.params.owner, req.params.repo, {
            state: req.query.state || 'open',
            ...repoArgs(req)
        });
        res.json(result);
    } catch (error) {
        sendGithubError(res, error);
    }
};

exports.searchCode = async (req, res) => {
    try {
        if (!req.query.q) return res.status(400).json({ error: 'q is required.' });
        const result = await githubService.searchCode(
            req.userId,
            req.params.owner,
            req.params.repo,
            req.query.q,
            { projectId: req.query.projectId }
        );
        res.json(result);
    } catch (error) {
        sendGithubError(res, error);
    }
};

exports.refreshRepository = async (req, res) => {
    try {
        githubService.invalidateRepoCache(req.userId, req.params.owner, req.params.repo);
        const repository = await githubService.getRepository(req.userId, req.params.owner, req.params.repo, true);
        res.json({ success: true, repository });
    } catch (error) {
        sendGithubError(res, error);
    }
};

exports.getRelationships = async (req, res) => {
    try {
        const filePath = req.query.path;
        if (!filePath) return res.status(400).json({ error: 'path is required.' });
        if (!req.query.projectId) return res.status(400).json({ error: 'projectId is required.' });
        const file = await githubService.getFile(req.userId, req.params.owner, req.params.repo, filePath, repoArgs(req));
        const relationships = await githubService.analyzeFileRelationships(
            req.userId,
            req.query.projectId,
            req.params.owner,
            req.params.repo,
            filePath,
            file.content
        );
        res.json({ relationships });
    } catch (error) {
        sendGithubError(res, error);
    }
};

exports.indexRepository = async (req, res) => {
    try {
        const { projectId, ref } = req.body || {};
        if (!projectId) return res.status(400).json({ error: 'projectId is required.' });
        const { job, alreadyRunning } = startIndexJob(req.userId, projectId, req.params.owner, req.params.repo);
        if (alreadyRunning) {
            return res.json(publicIndexJob(job));
        }
        setImmediate(async () => {
            try {
                const result = await indexGithubRepository(req.userId, projectId, req.params.owner, req.params.repo, { ref });
                updateIndexJob(req.userId, projectId, req.params.owner, req.params.repo, {
                    status: result.indexed || result.fileCount === 0 ? 'complete' : 'complete',
                    indexedCount: result.indexedCount || 0,
                    skippedCount: result.skippedCount || 0,
                    fileCount: result.fileCount || 0,
                    percent: 100,
                    completedAt: Date.now(),
                    error: result.reason || null
                });
            } catch (error) {
                updateIndexJob(req.userId, projectId, req.params.owner, req.params.repo, {
                    status: 'error',
                    error: error.message,
                    completedAt: Date.now()
                });
            }
        });
        res.status(202).json(publicIndexJob(job));
    } catch (error) {
        sendGithubError(res, error);
    }
};

exports.getIndexStatus = async (req, res) => {
    try {
        if (!req.query.projectId) return res.status(400).json({ error: 'projectId is required.' });
        const job = getIndexJob(req.userId, req.query.projectId, req.params.owner, req.params.repo);
        res.json(publicIndexJob(job));
    } catch (error) {
        sendGithubError(res, error);
    }
};
