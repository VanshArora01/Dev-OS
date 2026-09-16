const githubService = require('./githubService');
const { indexGithubFile } = require('./githubRag');

function fail(error) {
    const mapped = githubService.mapGithubError(error, error.status);
    return {
        success: false,
        error: {
            code: mapped.code,
            message: mapped.message,
            retryable: mapped.retryable
        }
    };
}

async function resolveRepoArgs(toolArgs, context) {
    const { userId, projectId } = context;
    const { repo } = await githubService.resolveProjectRepo(
        userId,
        projectId,
        toolArgs.owner,
        toolArgs.repo
    );
    return {
        owner: repo.owner,
        repo: repo.name,
        fullName: repo.fullName,
        defaultBranch: repo.defaultBranch
    };
}

function githubSource(title, url, extra = {}) {
    return { title, url, ...extra };
}

async function executeGithubTool(toolName, toolArgs, context) {
    const { userId, projectId } = context;
    const args = toolArgs || {};

    try {
        switch (toolName) {
            case 'github_list_repositories': {
                const linked = await githubService.listProjectRepositories(userId, projectId);
                if (linked.repositories?.length) {
                    return { success: true, repositories: linked.repositories, scope: 'project' };
                }
                const accessible = await githubService.listAccessibleRepositories(userId);
                return {
                    success: true,
                    repositories: accessible.repositories,
                    scope: 'accessible',
                    note: 'No repository is linked to this project yet. Ask the user to connect one from the GitHub tab.'
                };
            }
            case 'github_get_repository': {
                const target = await resolveRepoArgs(args, context);
                const repository = await githubService.getRepository(userId, target.owner, target.repo);
                return {
                    success: true,
                    repository,
                    source: githubSource(`GitHub → ${repository.fullName}`, repository.htmlUrl)
                };
            }
            case 'github_list_files': {
                const target = await resolveRepoArgs(args, context);
                const tree = await githubService.listTree(userId, target.owner, target.repo, {
                    path: args.path || '',
                    ref: args.ref,
                    projectId
                });
                return {
                    success: true,
                    path: tree.path,
                    entries: tree.entries,
                    source: githubSource(
                        `GitHub → ${target.fullName}/${tree.path || 'root'}`,
                        `https://github.com/${target.fullName}/tree/${args.ref || target.defaultBranch}/${tree.path || ''}`
                    )
                };
            }
            case 'github_get_file': {
                const target = await resolveRepoArgs(args, context);
                const file = await githubService.getFile(userId, target.owner, target.repo, args.path, {
                    ref: args.ref,
                    projectId
                });
                if (!file.binary && file.content && file.content.length >= 20) {
                    indexGithubFile(userId, projectId, target.owner, target.repo, args.path, { ref: args.ref }).catch(() => {});
                }
                const relationships = await githubService.analyzeFileRelationships(
                    userId, projectId, target.owner, target.repo, args.path, file.content
                );
                return {
                    success: true,
                    file: {
                        path: file.path,
                        language: file.language,
                        size: file.size,
                        sha: file.sha,
                        binary: file.binary,
                        tooLarge: file.tooLarge,
                        truncated: file.truncated,
                        commit: file.commit
                    },
                    text: file.binary ? null : file.content,
                    relationships,
                    source: githubSource(`GitHub → ${file.path}`, file.htmlUrl)
                };
            }
            case 'github_get_file_history': {
                const target = await resolveRepoArgs(args, context);
                const history = await githubService.getFileHistory(userId, target.owner, target.repo, args.path, { projectId });
                return {
                    success: true,
                    path: args.path,
                    commits: history.commits,
                    source: githubSource(`GitHub → history ${args.path}`)
                };
            }
            case 'github_list_commits': {
                const target = await resolveRepoArgs(args, context);
                const result = await githubService.listCommits(userId, target.owner, target.repo, {
                    sha: args.sha,
                    path: args.path,
                    projectId
                });
                return {
                    success: true,
                    commits: result.commits,
                    source: githubSource(`GitHub → commits ${target.fullName}`)
                };
            }
            case 'github_get_commit': {
                const target = await resolveRepoArgs(args, context);
                const result = await githubService.getCommit(userId, target.owner, target.repo, args.sha, { projectId });
                return {
                    success: true,
                    commit: result.commit,
                    traceability: result.traceability,
                    source: githubSource(`GitHub → commit ${String(args.sha).slice(0, 7)}`, result.commit.htmlUrl)
                };
            }
            case 'github_list_pull_requests': {
                const target = await resolveRepoArgs(args, context);
                const result = await githubService.listPullRequests(userId, target.owner, target.repo, {
                    state: args.state || 'all',
                    projectId
                });
                return {
                    success: true,
                    pullRequests: result.pullRequests,
                    source: githubSource(`GitHub → pull requests ${target.fullName}`)
                };
            }
            case 'github_get_pull_request': {
                const target = await resolveRepoArgs(args, context);
                const result = await githubService.getPullRequest(userId, target.owner, target.repo, args.number, { projectId });
                return {
                    success: true,
                    pullRequest: result.pullRequest,
                    traceability: result.traceability,
                    source: githubSource(`GitHub → PR #${args.number}`, result.pullRequest.htmlUrl)
                };
            }
            case 'github_list_branches': {
                const target = await resolveRepoArgs(args, context);
                const result = await githubService.listBranches(userId, target.owner, target.repo, { projectId });
                return { success: true, ...result };
            }
            case 'github_list_issues': {
                const target = await resolveRepoArgs(args, context);
                const result = await githubService.listIssues(userId, target.owner, target.repo, {
                    state: args.state || 'open',
                    projectId
                });
                return { success: true, issues: result.issues };
            }
            case 'github_search_code': {
                const target = await resolveRepoArgs(args, context);
                const result = await githubService.searchCode(userId, target.owner, target.repo, args.query, { projectId });
                return {
                    success: true,
                    ...result,
                    source: githubSource(`GitHub → search ${args.query}`)
                };
            }
            default:
                return fail({ message: `Unknown GitHub tool: ${toolName}`, code: 'UNKNOWN_TOOL' });
        }
    } catch (error) {
        return fail(error);
    }
}

module.exports = {
    executeGithubTool
};
