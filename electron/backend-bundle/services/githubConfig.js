function getBackendUrl() {
    return process.env.BACKEND_URL || 'http://127.0.0.1:5000';
}

function getFrontendUrl() {
    return process.env.FRONTEND_URL || 'http://localhost:8081';
}

function normalizePrivateKey(raw) {
    if (!raw) return null;
    const trimmed = String(raw).trim();
    if (!trimmed) return null;
    return trimmed.replace(/\\n/g, '\n');
}

function getGithubConfig() {
    const appId = process.env.GITHUB_APP_ID || process.env.GitHub_App_ID || '';
    const clientId = process.env.GITHUB_CLIENT_ID || process.env.GithHUb_Client_Id || '';
    const clientSecret = process.env.GITHUB_CLIENT_SECRET || process.env.GitHub_Client_Secret || '';
    const redirectUri = process.env.GITHUB_REDIRECT_URI
        || `${getBackendUrl()}/api/integrations/github/callback`;
    const appSlug = process.env.GITHUB_APP_SLUG || 'devos';
    const privateKey = normalizePrivateKey(process.env.GITHUB_PRIVATE_KEY || process.env.GITHUB_APP_PRIVATE_KEY);

    return {
        appId: String(appId).trim(),
        clientId: String(clientId).trim(),
        clientSecret: String(clientSecret).trim(),
        redirectUri,
        appSlug: String(appSlug).trim(),
        privateKey
    };
}

function assertGithubOAuthConfigured() {
    const config = getGithubConfig();
    if (!config.clientId || !config.clientSecret) {
        const error = new Error('GitHub App OAuth is not configured on the server.');
        error.code = 'GITHUB_NOT_CONFIGURED';
        throw error;
    }
    return config;
}

module.exports = {
    getBackendUrl,
    getFrontendUrl,
    getGithubConfig,
    assertGithubOAuthConfigured
};
