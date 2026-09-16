const path = require('path');
const fs = require('fs');
const os = require('os');

const ARTIFACT_ROOT = path.join(__dirname, '../../../temp/artifacts');
const MAX_ARTIFACT_AGE_MS = 24 * 60 * 60 * 1000;

function sanitizeFilename(name) {
    const base = String(name || 'document').replace(/[/\\]/g, '_');
    return base.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_+/g, '_').slice(0, 120);
}

function resolveArtifactDir(userId, projectId) {
    const safeUser = String(userId).replace(/[^a-fA-F0-9]/g, '');
    const safeProject = String(projectId).replace(/[^a-fA-F0-9]/g, '');
    const dir = path.join(ARTIFACT_ROOT, safeUser, safeProject);
    fs.mkdirSync(dir, { recursive: true });
    const resolved = path.resolve(dir);
    const rootResolved = path.resolve(ARTIFACT_ROOT);
    if (!resolved.startsWith(rootResolved)) {
        throw new Error('Invalid artifact path');
    }
    return resolved;
}

function uniqueFilename(dir, fileName) {
    const sanitized = sanitizeFilename(fileName);
    const ext = path.extname(sanitized);
    const base = path.basename(sanitized, ext);
    let candidate = sanitized;
    let version = 2;

    while (fs.existsSync(path.join(dir, candidate))) {
        candidate = `${base}_v${version}${ext}`;
        version += 1;
    }
    return candidate;
}

function saveArtifact(userId, projectId, buffer, fileName, mimeType, extraMeta = {}) {
    const dir = resolveArtifactDir(userId, projectId);
    const finalName = uniqueFilename(dir, fileName);
    const filePath = path.join(dir, finalName);
    fs.writeFileSync(filePath, buffer);

    const artifactId = `art_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const meta = {
        artifact_id: artifactId,
        fileName: finalName,
        mimeType,
        size: buffer.length,
        filePath,
        createdAt: Date.now(),
        ...extraMeta
    };

    const metaPath = path.join(dir, `${artifactId}.json`);
    fs.writeFileSync(metaPath, JSON.stringify(meta));

    return {
        artifact_id: artifactId,
        fileName: finalName,
        mimeType,
        size: buffer.length
    };
}

function getArtifactMeta(userId, projectId, artifactId) {
    const dir = resolveArtifactDir(userId, projectId);
    const safeId = String(artifactId).replace(/[^a-zA-Z0-9_-]/g, '');
    const metaPath = path.join(dir, `${safeId}.json`);

    if (!fs.existsSync(metaPath)) {
        return null;
    }

    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    const resolvedPath = path.resolve(meta.filePath);
    if (!resolvedPath.startsWith(dir)) {
        throw new Error('Artifact path escape blocked');
    }
    if (!fs.existsSync(resolvedPath)) {
        return null;
    }

    return { ...meta, filePath: resolvedPath };
}

function readArtifactBuffer(userId, projectId, artifactId) {
    const meta = getArtifactMeta(userId, projectId, artifactId);
    if (!meta) {
        throw new Error(`Artifact not found: ${artifactId}`);
    }
    return {
        buffer: fs.readFileSync(meta.filePath),
        fileName: meta.fileName,
        mimeType: meta.mimeType,
        size: meta.size
    };
}

function cleanupStaleArtifacts() {
    if (!fs.existsSync(ARTIFACT_ROOT)) return;

    const now = Date.now();
    const walk = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(full);
                continue;
            }
            try {
                const stat = fs.statSync(full);
                if (now - stat.mtimeMs > MAX_ARTIFACT_AGE_MS) {
                    fs.unlinkSync(full);
                }
            } catch (_) {
                /* ignore */
            }
        }
    };
    walk(ARTIFACT_ROOT);
}

module.exports = {
    saveArtifact,
    getArtifactMeta,
    readArtifactBuffer,
    sanitizeFilename,
    cleanupStaleArtifacts
};
