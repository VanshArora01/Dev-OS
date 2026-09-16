const path = require('path');

const JS_EXTS = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx']);
const PY_EXTS = new Set(['.py']);

function languageFromPath(filePath) {
    const ext = path.posix.extname(filePath || '').toLowerCase();
    const map = {
        '.ts': 'typescript',
        '.tsx': 'tsx',
        '.js': 'javascript',
        '.jsx': 'jsx',
        '.mjs': 'javascript',
        '.cjs': 'javascript',
        '.py': 'python',
        '.go': 'go',
        '.rs': 'rust',
        '.java': 'java',
        '.md': 'markdown',
        '.json': 'json',
        '.yml': 'yaml',
        '.yaml': 'yaml',
        '.css': 'css',
        '.html': 'html'
    };
    return map[ext] || (ext ? ext.slice(1) : '');
}

function resolveRelativeImport(fromPath, specifier) {
    if (!specifier.startsWith('.')) return null;
    const dir = path.posix.dirname(fromPath);
    let resolved = path.posix.normalize(path.posix.join(dir, specifier));
    if (resolved.startsWith('../')) return resolved.replace(/^\.\.\//, '');
    return resolved.replace(/^\.\//, '');
}

function parseJsTs(filePath, content) {
    const imports = [];
    const exports = [];
    const importRe = /(?:import\s+(?:type\s+)?(?:[\w*\s{},]+from\s+)?|export\s+(?:type\s+)?[\w*\s{},]*from\s+|require\s*\(\s*|import\s*\(\s*)['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRe.exec(content))) {
        const spec = match[1];
        const resolved = resolveRelativeImport(filePath, spec);
        imports.push(resolved || spec);
    }

    const exportRe = /export\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var|type|interface|enum)\s+([A-Za-z0-9_]+)/g;
    while ((match = exportRe.exec(content))) {
        exports.push(match[1]);
    }

    return {
        language: languageFromPath(filePath),
        imports: [...new Set(imports)].slice(0, 80),
        exports: [...new Set(exports)].slice(0, 80)
    };
}

function parsePython(filePath, content) {
    const imports = [];
    const exports = [];
    const lines = content.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        const fromMatch = trimmed.match(/^from\s+([.\w]+)\s+import\s+/);
        const importMatch = trimmed.match(/^import\s+([.\w]+)/);
        if (fromMatch) {
            const spec = fromMatch[1];
            if (spec.startsWith('.')) {
                imports.push(resolveRelativeImport(filePath, spec.replace(/\./g, '/')) || spec);
            } else {
                imports.push(spec);
            }
        } else if (importMatch) {
            imports.push(importMatch[1]);
        }
        const defMatch = trimmed.match(/^(?:async\s+)?def\s+([A-Za-z0-9_]+)/);
        const classMatch = trimmed.match(/^class\s+([A-Za-z0-9_]+)/);
        if (defMatch) exports.push(defMatch[1]);
        if (classMatch) exports.push(classMatch[1]);
    }
    return {
        language: 'python',
        imports: [...new Set(imports)].slice(0, 80),
        exports: [...new Set(exports)].slice(0, 80)
    };
}

function analyzeSourceFile(filePath, content) {
    const language = languageFromPath(filePath);
    const ext = path.posix.extname(filePath || '').toLowerCase();
    const supported = JS_EXTS.has(ext) || PY_EXTS.has(ext);

    if (!supported) {
        return {
            status: 'unsupported',
            language,
            imports: [],
            exports: [],
            relatedPaths: []
        };
    }

    if (!content || typeof content !== 'string') {
        return { status: 'analyzed', language, imports: [], exports: [], relatedPaths: [] };
    }

    const parsed = JS_EXTS.has(ext) ? parseJsTs(filePath, content) : parsePython(filePath, content);
    return {
        status: 'analyzed',
        ...parsed,
        relatedPaths: []
    };
}

module.exports = {
    languageFromPath,
    analyzeSourceFile
};
