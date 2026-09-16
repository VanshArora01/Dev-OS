const crypto = require('crypto');
const axios = require('axios');
const OAuthState = require('../models/OAuthState');
const UserIntegration = require('../models/UserIntegration');
const { encrypt, decrypt } = require('../utils/credentialService');
const { assertGithubOAuthConfigured, getGithubConfig } = require('./githubConfig');

const STATE_TTL_MS = 10 * 60 * 1000;
const GITHUB_API = 'https://api.github.com';
const GITHUB_ACCEPT = 'application/vnd.github+json';
const GITHUB_API_VERSION = '2022-11-28';

function createAppJwt() {
    const { appId, privateKey } = getGithubConfig();
    if (!appId || !privateKey) return null;

    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
        iat: now - 60,
        exp: now + 540,
        iss: appId
    })).toString('base64url');
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(`${header}.${payload}`);
    const signature = signer.sign(privateKey, 'base64url');
    return `${header}.${payload}.${signature}`;
}

async function createAuthUrl(userId, clerkId) {
    const config = assertGithubOAuthConfigured();
    const state = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + STATE_TTL_MS);

    await OAuthState.create({
        state,
        userId,
        clerkId,
        provider: 'github',
        expiresAt
    });

    const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        state,
        allow_signup: 'false'
    });

    console.log('[GitHub] Authorization started');
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

function getInstallUrl(state) {
    const { appSlug } = getGithubConfig();
    const params = new URLSearchParams();
    if (state) params.set('state', state);
    return `https://github.com/apps/${encodeURIComponent(appSlug)}/installations/new?${params.toString()}`;
}

async function validateAndConsumeState(state) {
    if (!state) {
        throw new Error('Missing OAuth state.');
    }

    const record = await OAuthState.findOneAndDelete({ state, provider: 'github' });
    if (!record) {
        const fallback = await OAuthState.findOneAndDelete({ state });
        if (!fallback) {
            throw new Error('Invalid or expired OAuth state.');
        }
        if (fallback.expiresAt < new Date()) {
            throw new Error('OAuth state has expired.');
        }
        return fallback;
    }
    if (record.expiresAt < new Date()) {
        throw new Error('OAuth state has expired.');
    }
    return record;
}

async function exchangeCodeForTokens(code) {
    const config = assertGithubOAuthConfigured();
    const response = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
            client_id: config.clientId,
            client_secret: config.clientSecret,
            code,
            redirect_uri: config.redirectUri
        },
        {
            headers: { Accept: 'application/json' },
            timeout: 15000
        }
    );

    if (response.data?.error) {
        throw new Error(response.data.error_description || 'GitHub token exchange failed.');
    }
    if (!response.data?.access_token) {
        throw new Error('GitHub did not return an access token.');
    }

    return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token || null,
        token_type: response.data.token_type,
        scope: response.data.scope || '',
        expires_in: response.data.expires_in || null
    };
}

async function githubRequest(accessToken, method, url, options = {}) {
    const response = await axios({
        method,
        url: url.startsWith('http') ? url : `${GITHUB_API}${url}`,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: GITHUB_ACCEPT,
            'X-GitHub-Api-Version': GITHUB_API_VERSION,
            'User-Agent': 'DevOS',
            ...(options.headers || {})
        },
        params: options.params,
        data: options.data,
        timeout: options.timeout || 20000,
        validateStatus: () => true
    });
    return response;
}

async function getGithubIdentity(accessToken) {
    const response = await githubRequest(accessToken, 'GET', '/user');
    if (response.status !== 200) {
        throw new Error('Failed to load GitHub user profile.');
    }
    const data = response.data || {};
    return {
        id: String(data.id || ''),
        login: data.login || '',
        avatarUrl: data.avatar_url || '',
        name: data.name || data.login || ''
    };
}

async function getInstallations(accessToken) {
    const response = await githubRequest(accessToken, 'GET', '/user/installations', {
        params: { per_page: 100 }
    });
    if (response.status !== 200) {
        console.warn('[GitHub] Failed to list installations', response.status);
        return [];
    }
    return response.data?.installations || [];
}

async function getInstallationRepositories(accessToken, installationId) {
    const repos = [];
    let page = 1;
    while (page <= 10) {
        const response = await githubRequest(
            accessToken,
            'GET',
            `/user/installations/${installationId}/repositories`,
            { params: { per_page: 100, page } }
        );
        if (response.status !== 200) break;
        const batch = response.data?.repositories || [];
        repos.push(...batch);
        if (batch.length < 100) break;
        page += 1;
    }
    return repos;
}

async function refreshUserToken(refreshToken) {
    const config = assertGithubOAuthConfigured();
    if (!refreshToken) return null;
    const response = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
            client_id: config.clientId,
            client_secret: config.clientSecret,
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        },
        {
            headers: { Accept: 'application/json' },
            timeout: 15000
        }
    );
    if (!response.data?.access_token) return null;
    return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token || refreshToken,
        expires_in: response.data.expires_in || null
    };
}

async function saveIntegration(userId, clerkId, tokens, identity, installation) {
    const tokenExpiry = tokens.expires_in
        ? new Date(Date.now() + Number(tokens.expires_in) * 1000)
        : null;

    const metadata = {
        login: identity.login,
        avatarUrl: identity.avatarUrl,
        name: identity.name,
        installationId: installation?.id ? String(installation.id) : null,
        installationAccount: installation?.account?.login || null,
        repositorySelection: installation?.repository_selection || null
    };

    const integration = await UserIntegration.findOneAndUpdate(
        { userId, provider: 'github' },
        {
            clerkId,
            providerAccountId: identity.id || identity.login,
            accountEmail: identity.login,
            encryptedAccessToken: encrypt(tokens.access_token),
            encryptedRefreshToken: encrypt(tokens.refresh_token || ''),
            tokenExpiry,
            scopes: tokens.scope ? String(tokens.scope).split(/[,\s]+/).filter(Boolean) : [],
            status: 'connected',
            lastError: null,
            metadata
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log('[GitHub] Installation identified', metadata.installationId || 'none');
    return integration;
}

async function getGithubIntegrationForUser(userId) {
    return UserIntegration.findOne({ userId, provider: 'github', status: 'connected' });
}

async function markGithubRevoked(userId, message) {
    await UserIntegration.findOneAndUpdate(
        { userId, provider: 'github' },
        {
            status: 'revoked',
            lastError: message,
            encryptedAccessToken: null,
            encryptedRefreshToken: null
        }
    );
}

async function disconnectGithubIntegration(userId) {
    const integration = await UserIntegration.findOne({ userId, provider: 'github' });
    if (!integration) return null;
    integration.status = 'disconnected';
    integration.encryptedAccessToken = null;
    integration.encryptedRefreshToken = null;
    integration.tokenExpiry = null;
    integration.lastError = null;
    await integration.save();
    console.log('[GitHub] Integration disconnected');
    return integration;
}

async function getValidAccessToken(userId) {
    const integration = await getGithubIntegrationForUser(userId);
    if (!integration) {
        const error = new Error('GitHub is not connected. Connect GitHub from Settings → Integrations.');
        error.code = 'GITHUB_NOT_CONNECTED';
        throw error;
    }

    let accessToken = decrypt(integration.encryptedAccessToken);
    if (!accessToken) {
        await markGithubRevoked(userId, 'GitHub authorization is missing. Please reconnect.');
        const error = new Error('GitHub needs to be reconnected. Go to Settings → Integrations.');
        error.code = 'GITHUB_RECONNECT_REQUIRED';
        throw error;
    }

    const expiringSoon = integration.tokenExpiry
        && integration.tokenExpiry.getTime() < Date.now() + 60 * 1000;

    if (expiringSoon) {
        try {
            const refreshToken = decrypt(integration.encryptedRefreshToken);
            const refreshed = await refreshUserToken(refreshToken);
            if (refreshed?.access_token) {
                accessToken = refreshed.access_token;
                await UserIntegration.findByIdAndUpdate(integration._id, {
                    encryptedAccessToken: encrypt(refreshed.access_token),
                    encryptedRefreshToken: encrypt(refreshed.refresh_token || refreshToken),
                    tokenExpiry: refreshed.expires_in
                        ? new Date(Date.now() + Number(refreshed.expires_in) * 1000)
                        : null,
                    status: 'connected',
                    lastError: null
                });
            }
        } catch (error) {
            console.warn('[GitHub] Token refresh failed:', error.message);
            await markGithubRevoked(userId, 'GitHub authorization expired. Please reconnect.');
            const reconnectError = new Error('GitHub needs to be reconnected. Go to Settings → Integrations.');
            reconnectError.code = 'GITHUB_RECONNECT_REQUIRED';
            throw reconnectError;
        }
    }

    return { accessToken, integration };
}

async function createInstallationAccessToken(installationId) {
    const jwt = createAppJwt();
    if (!jwt || !installationId) return null;
    const response = await axios.post(
        `${GITHUB_API}/app/installations/${installationId}/access_tokens`,
        {},
        {
            headers: {
                Authorization: `Bearer ${jwt}`,
                Accept: GITHUB_ACCEPT,
                'X-GitHub-Api-Version': GITHUB_API_VERSION,
                'User-Agent': 'DevOS'
            },
            timeout: 15000,
            validateStatus: () => true
        }
    );
    if (response.status >= 300) return null;
    return response.data?.token || null;
}

module.exports = {
    createAuthUrl,
    getInstallUrl,
    validateAndConsumeState,
    exchangeCodeForTokens,
    getGithubIdentity,
    getInstallations,
    getInstallationRepositories,
    saveIntegration,
    getGithubIntegrationForUser,
    disconnectGithubIntegration,
    markGithubRevoked,
    getValidAccessToken,
    createInstallationAccessToken,
    githubRequest,
    createAppJwt
};
