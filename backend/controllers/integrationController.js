const {
    createAuthUrl,
    validateAndConsumeState,
    exchangeCodeForTokens,
    getGoogleAccountEmail,
    saveIntegration,
    getIntegrationForUser,
    disconnectIntegration
} = require('../services/googleOAuthService');
const googleDriveConnector = require('../services/googleDriveConnector');
const { getClerkIdFromRequest } = require('../utils/auth');

const FRONTEND_SETTINGS_URL = process.env.FRONTEND_URL
    ? `${process.env.FRONTEND_URL}/#/settings`
    : 'http://localhost:8081/#/settings';

exports.connectGoogle = async (req, res) => {
    try {
        const authUrl = await createAuthUrl(req.userId, req.clerkId);
        res.redirect(authUrl);
    } catch (error) {
        console.error('Google connect error:', error.message);
        res.redirect(`${FRONTEND_SETTINGS_URL}?drive_error=${encodeURIComponent(error.message)}`);
    }
};

exports.googleCallback = async (req, res) => {
    try {
        const { code, state, error } = req.query;

        if (error) {
            return res.redirect(`${FRONTEND_SETTINGS_URL}?drive_error=${encodeURIComponent('Google authorization was denied.')}`);
        }

        if (!code) {
            return res.redirect(`${FRONTEND_SETTINGS_URL}?drive_error=${encodeURIComponent('Missing authorization code.')}`);
        }

        const stateRecord = await validateAndConsumeState(state);
        const tokens = await exchangeCodeForTokens(code);

        if (!tokens.access_token) {
            throw new Error('Google did not return an access token.');
        }

        const accountInfo = await getGoogleAccountEmail(tokens.access_token);
        await saveIntegration(stateRecord.userId, stateRecord.clerkId, tokens, accountInfo);

        res.redirect(`${FRONTEND_SETTINGS_URL}?drive_connected=1`);
    } catch (callbackError) {
        console.error('Google callback error:', callbackError.message);
        res.redirect(`${FRONTEND_SETTINGS_URL}?drive_error=${encodeURIComponent(callbackError.message)}`);
    }
};

exports.getGoogleStatus = async (req, res) => {
    try {
        const integration = await getIntegrationForUser(req.userId);
        if (!integration || integration.status !== 'connected') {
            return res.json({
                connected: false,
                provider: 'google_drive',
                accountEmail: null,
                status: integration?.status || 'disconnected'
            });
        }

        res.json({
            connected: true,
            provider: 'google_drive',
            accountEmail: integration.accountEmail,
            status: integration.status,
            connectedAt: integration.updatedAt
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.disconnectGoogle = async (req, res) => {
    try {
        await disconnectIntegration(req.userId);
        res.json({ success: true, message: 'Google Drive disconnected.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.listGoogleFiles = async (req, res) => {
    try {
        const result = await googleDriveConnector.listFiles(req.userId, {
            filters: req.query.folderId ? { folderId: req.query.folderId } : {},
            pageSize: Number(req.query.pageSize) || 20,
            pageToken: req.query.pageToken || undefined
        });
        res.json(result);
    } catch (error) {
        const mapped = googleDriveConnector.mapDriveError(error);
        res.status(400).json({ error: mapped.message, code: mapped.code });
    }
};

exports.getGoogleFile = async (req, res) => {
    try {
        const file = await googleDriveConnector.getFileMetadata(req.userId, req.params.id);
        res.json({ file });
    } catch (error) {
        const mapped = googleDriveConnector.mapDriveError(error);
        res.status(400).json({ error: mapped.message, code: mapped.code });
    }
};

exports.getConnectUrl = async (req, res) => {
    try {
        const { userId, clerkId } = req.auth;
        if (!clerkId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const authUrl = await createAuthUrl(userId, clerkId);
        res.json({
            connectUrl: authUrl
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
