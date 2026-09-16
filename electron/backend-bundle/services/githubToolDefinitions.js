function getGithubReadTools() {
    return [
        {
            type: 'function',
            function: {
                name: 'github_list_repositories',
                description: 'List GitHub repositories connected to this DevOS project, or accessible repositories if none are linked yet.',
                parameters: { type: 'object', properties: {} }
            }
        },
        {
            type: 'function',
            function: {
                name: 'github_get_repository',
                description: 'Get metadata for a GitHub repository linked to this project.',
                parameters: {
                    type: 'object',
                    properties: {
                        owner: { type: 'string' },
                        repo: { type: 'string' }
                    }
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'github_list_files',
                description: 'List files and folders at a repository path. Defaults to repository root. Use to explore the codebase.',
                parameters: {
                    type: 'object',
                    properties: {
                        owner: { type: 'string' },
                        repo: { type: 'string' },
                        path: { type: 'string', description: 'Directory path, empty for root' },
                        ref: { type: 'string', description: 'Branch or SHA' }
                    }
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'github_get_file',
                description: 'Read a source file from the project GitHub repository. Use for explaining code, functions, or file purpose.',
                parameters: {
                    type: 'object',
                    properties: {
                        owner: { type: 'string' },
                        repo: { type: 'string' },
                        path: { type: 'string' },
                        ref: { type: 'string' }
                    },
                    required: ['path']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'github_get_file_history',
                description: 'Get recent commits that changed a specific file path.',
                parameters: {
                    type: 'object',
                    properties: {
                        owner: { type: 'string' },
                        repo: { type: 'string' },
                        path: { type: 'string' }
                    },
                    required: ['path']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'github_list_commits',
                description: 'List recent commits in the project repository.',
                parameters: {
                    type: 'object',
                    properties: {
                        owner: { type: 'string' },
                        repo: { type: 'string' },
                        sha: { type: 'string', description: 'Branch name or commit SHA' },
                        path: { type: 'string' }
                    }
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'github_get_commit',
                description: 'Get a commit including changed files, stats, and patch excerpts.',
                parameters: {
                    type: 'object',
                    properties: {
                        owner: { type: 'string' },
                        repo: { type: 'string' },
                        sha: { type: 'string' }
                    },
                    required: ['sha']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'github_list_pull_requests',
                description: 'List pull requests. state can be open, closed, or all.',
                parameters: {
                    type: 'object',
                    properties: {
                        owner: { type: 'string' },
                        repo: { type: 'string' },
                        state: { type: 'string', enum: ['open', 'closed', 'all'] }
                    }
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'github_get_pull_request',
                description: 'Get pull request details, files, and commits by number.',
                parameters: {
                    type: 'object',
                    properties: {
                        owner: { type: 'string' },
                        repo: { type: 'string' },
                        number: { type: 'number' }
                    },
                    required: ['number']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'github_list_branches',
                description: 'List repository branches and identify the default branch.',
                parameters: {
                    type: 'object',
                    properties: {
                        owner: { type: 'string' },
                        repo: { type: 'string' }
                    }
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'github_list_issues',
                description: 'List GitHub issues (not pull requests).',
                parameters: {
                    type: 'object',
                    properties: {
                        owner: { type: 'string' },
                        repo: { type: 'string' },
                        state: { type: 'string', enum: ['open', 'closed', 'all'] }
                    }
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'github_search_code',
                description: 'Search code in the project repository. Use a SHORT query such as a function name or keyword.',
                parameters: {
                    type: 'object',
                    properties: {
                        owner: { type: 'string' },
                        repo: { type: 'string' },
                        query: { type: 'string' }
                    },
                    required: ['query']
                }
            }
        }
    ];
}

module.exports = {
    getGithubReadTools
};
