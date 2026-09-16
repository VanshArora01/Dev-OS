const { google } = require('googleapis');
const crypto = require('crypto');
const OAuthState = require('../models/OAuthState');
const UserIntegration = require('../models/UserIntegration');
const { encrypt, decrypt } = require('../utils/credentialService');

const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';
const STATE_TTL_MS = 10 * 60 * 1000;

function getOAuthClient() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/integrations/google/callback';

    if (!clientId || !clientSecret) {
        throw new Error('Google OAuth is not configured on the server.');
    }

    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

async function createAuthUrl(userId, clerkId) {
    const oauth2Client = getOAuthClient();
    const state = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + STATE_TTL_MS);

    await OAuthState.create({
        state,
        userId,
        clerkId,
        provider: 'google_drive',
        expiresAt
    });

    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: [
            GOOGLE_DRIVE_SCOPE,
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
        ],
        state,
        include_granted_scopes: true
    });

    return authUrl;
}

async function validateAndConsumeState(state) {
    if (!state) {
        throw new Error('Missing OAuth state.');
    }

    const record = await OAuthState.findOneAndDelete({ state });
    if (!record) {
        throw new Error('Invalid or expired OAuth state.');
    }
    if (record.expiresAt < new Date()) {
        throw new Error('OAuth state has expired.');
    }

    return record;
}

async function exchangeCodeForTokens(code) {
    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
}

async function getGoogleAccountEmail(accessToken) {
    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials({ access_token: accessToken });
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();
    return {
        email: data.email || '',
        id: data.id || ''
    };
}

async function saveIntegration(userId, clerkId, tokens, accountInfo) {
    const encryptedAccessToken = encrypt(tokens.access_token);
    const encryptedRefreshToken = encrypt(tokens.refresh_token || '');
    const tokenExpiry = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

    const integration = await UserIntegration.findOneAndUpdate(
        { userId, provider: 'google_drive' },
        {
            clerkId,
            providerAccountId: accountInfo.id || accountInfo.email,
            accountEmail: accountInfo.email || '',
            encryptedAccessToken,
            encryptedRefreshToken,
            tokenExpiry,
            scopes: [GOOGLE_DRIVE_SCOPE],
            status: 'connected',
            lastError: null
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return integration;
}

async function getIntegrationForUser(userId) {
    return UserIntegration.findOne({ userId, provider: 'google_drive', status: 'connected' });
}

async function disconnectIntegration(userId) {
    const integration = await UserIntegration.findOne({ userId, provider: 'google_drive' });
    if (!integration) {
        return null;
    }

    try {
        const refreshToken = decrypt(integration.encryptedRefreshToken);
        if (refreshToken) {
            const oauth2Client = getOAuthClient();
            await oauth2Client.revokeToken(refreshToken).catch(() => {});
        }
    } catch (error) {
        console.warn('Google token revoke failed:', error.message);
    }

    integration.status = 'disconnected';
    integration.encryptedAccessToken = null;
    integration.encryptedRefreshToken = null;
    integration.tokenExpiry = null;
    await integration.save();
    return integration;
}

async function markIntegrationRevoked(userId, message) {
    await UserIntegration.findOneAndUpdate(
        { userId, provider: 'google_drive' },
        { status: 'revoked', lastError: message, encryptedAccessToken: null }
    );
}

async function getAuthenticatedClient(userId) {
    const integration = await getIntegrationForUser(userId);
    if (!integration) {
        const error = new Error('Google Drive is not connected. Connect your Google account from Settings → Integrations.');
        error.code = 'DRIVE_NOT_CONNECTED';
        throw error;
    }

    const oauth2Client = getOAuthClient();
    const accessToken = decrypt(integration.encryptedAccessToken);
    const refreshToken = decrypt(integration.encryptedRefreshToken);

    oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
        expiry_date: integration.tokenExpiry ? integration.tokenExpiry.getTime() : null
    });

    oauth2Client.on('tokens', async (tokens) => {
        const update = {};
        if (tokens.access_token) {
            update.encryptedAccessToken = encrypt(tokens.access_token);
        }
        if (tokens.refresh_token) {
            update.encryptedRefreshToken = encrypt(tokens.refresh_token);
        }
        if (tokens.expiry_date) {
            update.tokenExpiry = new Date(tokens.expiry_date);
        }
        if (Object.keys(update).length > 0) {
            await UserIntegration.findByIdAndUpdate(integration._id, update);
        }
    });

    if (integration.tokenExpiry && integration.tokenExpiry <= new Date()) {
        try {
            const { credentials } = await oauth2Client.refreshAccessToken();
            await UserIntegration.findByIdAndUpdate(integration._id, {
                encryptedAccessToken: encrypt(credentials.access_token),
                encryptedRefreshToken: encrypt(credentials.refresh_token || refreshToken),
                tokenExpiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
                status: 'connected',
                lastError: null
            });
            oauth2Client.setCredentials(credentials);
        } catch (error) {
            await markIntegrationRevoked(userId, 'Google Drive authorization was revoked. Please reconnect from Settings.');
            const reconnectError = new Error('Google Drive needs to be reconnected. Go to Settings → Integrations.');
            reconnectError.code = 'DRIVE_RECONNECT_REQUIRED';
            throw reconnectError;
        }
    }

    return { oauth2Client, integration };
}

module.exports = {
    GOOGLE_DRIVE_SCOPE,
    createAuthUrl,
    validateAndConsumeState,
    exchangeCodeForTokens,
    getGoogleAccountEmail,
    saveIntegration,
    getIntegrationForUser,
    disconnectIntegration,
    getAuthenticatedClient
};
