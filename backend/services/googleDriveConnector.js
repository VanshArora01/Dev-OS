const { google } = require('googleapis');
const { Readable } = require('stream');
const { getAuthenticatedClient } = require('./googleOAuthService');

const MAX_PAGE_SIZE = 50;
const MAX_DOWNLOAD_BYTES = 15 * 1024 * 1024;

function bufferToStream(buffer) {
    const data = buffer instanceof Buffer ? buffer : Buffer.from(buffer);
    return Readable.from(data);
}

function normalizeFile(file) {
    return {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size ? Number(file.size) : 0,
        createdTime: file.createdTime || null,
        modifiedTime: file.modifiedTime || null,
        webViewLink: file.webViewLink || null,
        parents: file.parents || [],
        owners: (file.owners || []).map((owner) => owner.emailAddress || owner.displayName).filter(Boolean),
        trashed: Boolean(file.trashed)
    };
}

function buildDriveQuery(filters = {}) {
    const parts = ["trashed = false"];

    if (filters.name) {
        parts.push(`name contains '${filters.name.replace(/'/g, "\\'")}'`);
    }
    if (filters.mimeType) {
        parts.push(`mimeType = '${filters.mimeType}'`);
    }
    if (filters.fullText) {
        parts.push(`fullText contains '${filters.fullText.replace(/'/g, "\\'")}'`);
    }
    if (filters.folderId) {
        parts.push(`'${filters.folderId}' in parents`);
    }
    if (filters.modifiedAfter) {
        parts.push(`modifiedTime > '${filters.modifiedAfter}'`);
    }

    return parts.join(' and ');
}

async function getDriveClient(userId) {
    const { oauth2Client } = await getAuthenticatedClient(userId);
    return google.drive({ version: 'v3', auth: oauth2Client });
}

async function listFiles(userId, options = {}) {
    const drive = await getDriveClient(userId);
    const pageSize = Math.min(options.pageSize || MAX_PAGE_SIZE, MAX_PAGE_SIZE);
    const q = options.query || buildDriveQuery(options.filters || {});

    const response = await drive.files.list({
        q,
        pageSize,
        pageToken: options.pageToken || undefined,
        fields: 'nextPageToken, files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,parents,owners,trashed)',
        orderBy: options.orderBy || 'modifiedTime desc',
        supportsAllDrives: true,
        includeItemsFromAllDrives: true
    });

    return {
        files: (response.data.files || []).map(normalizeFile),
        nextPageToken: response.data.nextPageToken || null
    };
}

async function searchFiles(userId, options = {}) {
    const parts = ['trashed = false'];

    if (options.query) {
        const escaped = options.query.replace(/'/g, "\\'");
        parts.push(`(name contains '${escaped}' or fullText contains '${escaped}')`);
    }
    if (options.mime_type || options.mimeType) {
        parts.push(`mimeType = '${options.mime_type || options.mimeType}'`);
    }
    if (options.folder_id || options.folderId) {
        parts.push(`'${options.folder_id || options.folderId}' in parents`);
    }

    return listFiles(userId, {
        ...options,
        query: parts.join(' and '),
        pageSize: options.pageSize || 20
    });
}

async function getFileMetadata(userId, fileId) {
    const drive = await getDriveClient(userId);
    const response = await drive.files.get({
        fileId,
        fields: 'id,name,mimeType,size,createdTime,modifiedTime,webViewLink,parents,owners,trashed',
        supportsAllDrives: true
    });
    return normalizeFile(response.data);
}

async function downloadFile(userId, fileId) {
    const metadata = await getFileMetadata(userId, fileId);
    if (metadata.size > MAX_DOWNLOAD_BYTES) {
        const error = new Error(`File "${metadata.name}" is too large to download (${metadata.size} bytes).`);
        error.code = 'FILE_TOO_LARGE';
        throw error;
    }

    const drive = await getDriveClient(userId);
    const response = await drive.files.get({
        fileId,
        alt: 'media',
        supportsAllDrives: true
    }, { responseType: 'arraybuffer' });

    return {
        metadata,
        buffer: Buffer.from(response.data)
    };
}

async function exportGoogleFile(userId, fileId, mimeType) {
    const metadata = await getFileMetadata(userId, fileId);
    const drive = await getDriveClient(userId);
    const response = await drive.files.export({
        fileId,
        mimeType
    }, { responseType: 'arraybuffer' });

    return {
        metadata,
        buffer: Buffer.from(response.data),
        exportedMimeType: mimeType
    };
}

async function createFile(userId, options) {
    const drive = await getDriveClient(userId);
    const requestBody = {
        name: options.name,
        mimeType: options.mimeType || 'text/plain',
        parents: options.parents || undefined,
        description: options.description || undefined
    };

    const media = options.content
        ? { mimeType: requestBody.mimeType, body: bufferToStream(Buffer.from(options.content, 'utf8')) }
        : options.buffer
            ? { mimeType: requestBody.mimeType, body: bufferToStream(options.buffer) }
            : undefined;

    const response = await drive.files.create({
        requestBody,
        media,
        fields: 'id,name,mimeType,size,createdTime,modifiedTime,webViewLink,parents,owners,trashed',
        supportsAllDrives: true
    });

    return normalizeFile(response.data);
}

async function uploadFile(userId, options) {
    const drive = await getDriveClient(userId);
    const requestBody = {
        name: options.name,
        parents: options.parents || undefined,
        mimeType: options.mimeType || 'application/octet-stream'
    };

    const buffer = options.buffer instanceof Buffer
        ? options.buffer
        : Buffer.from(options.buffer);

    const response = await drive.files.create({
        requestBody,
        media: {
            mimeType: requestBody.mimeType,
            body: bufferToStream(buffer)
        },
        fields: 'id,name,mimeType,size,createdTime,modifiedTime,webViewLink,parents,owners,trashed',
        supportsAllDrives: true
    });

    return normalizeFile(response.data);
}

async function updateFile(userId, fileId, options) {
    const drive = await getDriveClient(userId);
    const requestBody = {};
    if (options.name) requestBody.name = options.name;
    if (options.description) requestBody.description = options.description;
    if (options.mimeType) requestBody.mimeType = options.mimeType;

    const media = options.content
        ? { mimeType: options.mimeType || 'text/plain', body: bufferToStream(Buffer.from(options.content, 'utf8')) }
        : options.buffer
            ? { mimeType: options.mimeType || 'application/octet-stream', body: bufferToStream(options.buffer) }
            : undefined;

    const response = await drive.files.update({
        fileId,
        requestBody,
        media,
        fields: 'id,name,mimeType,size,createdTime,modifiedTime,webViewLink,parents,owners,trashed',
        supportsAllDrives: true
    });

    return normalizeFile(response.data);
}

async function renameFile(userId, fileId, newName) {
    return updateFile(userId, fileId, { name: newName });
}

async function moveFile(userId, fileId, newParentId, removeParents = []) {
    const drive = await getDriveClient(userId);
    const response = await drive.files.update({
        fileId,
        addParents: newParentId,
        removeParents: removeParents.length ? removeParents.join(',') : undefined,
        fields: 'id,name,mimeType,size,createdTime,modifiedTime,webViewLink,parents,owners,trashed',
        supportsAllDrives: true
    });
    return normalizeFile(response.data);
}

async function deleteFile(userId, fileId) {
    const metadata = await getFileMetadata(userId, fileId);
    const drive = await getDriveClient(userId);
    await drive.files.delete({ fileId, supportsAllDrives: true });
    return { success: true, deleted: metadata };
}

async function createFolder(userId, name, parentId = null) {
    return createFile(userId, {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : undefined
    });
}

async function findFolderByName(userId, folderName, parentId = null) {
    const filters = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder'
    };
    if (parentId) {
        filters.folderId = parentId;
    }
    const result = await listFiles(userId, { filters, pageSize: 5 });
    return result.files[0] || null;
}

function mapDriveError(error) {
    const status = error?.response?.status || error?.code;
    if (status === 404) {
        return new Error('File not found in Google Drive.');
    }
    if (status === 403) {
        return new Error('Permission denied for this Google Drive file.');
    }
    if (status === 429) {
        return new Error('Google Drive rate limit reached. Please try again shortly.');
    }
    if (error?.code === 'DRIVE_NOT_CONNECTED' || error?.code === 'DRIVE_RECONNECT_REQUIRED') {
        return error;
    }
    return new Error(error?.message || 'Google Drive request failed.');
}

module.exports = {
    normalizeFile,
    listFiles,
    searchFiles,
    getFileMetadata,
    downloadFile,
    exportGoogleFile,
    createFile,
    uploadFile,
    updateFile,
    renameFile,
    moveFile,
    deleteFile,
    createFolder,
    findFolderByName,
    mapDriveError,
    bufferToStream,
    MAX_DOWNLOAD_BYTES
};
