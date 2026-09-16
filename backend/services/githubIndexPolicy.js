const path = require('path');

const INCLUDE_EXTS = new Set([
    '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.py', '.java', '.go', '.rs',
    '.md', '.json', '.yml', '.yaml', '.sql', '.graphql'
]);

const EXCLUDED_DIR_PARTS = [
    'node_modules', 'dist', 'build', 'coverage', '.git', 'vendor',
    '.next', 'out', 'tmp', 'temp', '__pycache__', '.cache'
];

const MAX_INDEX_FILE_BYTES = 120 * 1024;

function shouldIndexPath(filePath, size = 0) {
    const parts = String(filePath || '').split('/');
    if (parts.some((part) => EXCLUDED_DIR_PARTS.includes(part))) return false;
    const ext = path.posix.extname(filePath).toLowerCase();
    if (!INCLUDE_EXTS.has(ext)) return false;
    if (size && size > MAX_INDEX_FILE_BYTES) return false;
    if (filePath.endsWith('.min.js') || filePath.endsWith('.min.css')) return false;
    if (filePath.endsWith('package-lock.json') || filePath.endsWith('yarn.lock') || filePath.endsWith('pnpm-lock.yaml')) {
        return false;
    }
    return true;
}

module.exports = {
    INCLUDE_EXTS,
    EXCLUDED_DIR_PARTS,
    MAX_INDEX_FILE_BYTES,
    shouldIndexPath
};
