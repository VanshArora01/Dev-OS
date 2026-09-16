const { normalizeToolName, ALL_CANONICAL_TOOLS } = require('./toolCatalog');

function parseFailedToolGeneration(failedGeneration) {
    if (!failedGeneration || typeof failedGeneration !== 'string') {
        return null;
    }

    const patterns = [
        /<function=([a-zA-Z0-9_]+)\s*,\s*(\{[\s\S]*?\})\s*>/i,
        /<function=([a-zA-Z0-9_]+)\s*(\{[\s\S]*?\})\s*<\/function>/i,
        /<function=([a-zA-Z0-9_]+)\s+(\{[\s\S]*?\})\s*<\/function>/i,
        /<function=([a-zA-Z0-9_]+)\s*\[(\{[\s\S]*?\})\]\s*<\/function>/i,
        /<function=([a-zA-Z0-9_]+)\s*\[(\{[\s\S]*?\})\]/i,
        /<function=([a-zA-Z0-9_]+)[\s\S]*?"query"\s*:\s*"([^"]+)"/i,
        /<function\.name>([^<]+)<\/function\.name>[\s\S]*?<function\.arguments>([\s\S]*?)<\/function\.arguments>/i
    ];

    for (const pattern of patterns) {
        const match = failedGeneration.match(pattern);
        if (!match) continue;

        const rawName = match[1].trim();
        const rawArgs = match[2].trim();

        let toolArgs;
        try {
            toolArgs = JSON.parse(rawArgs);
        } catch (error) {
            const queryMatch = rawArgs.match(/"query"\s*:\s*"([^"]+)"/i);
            if (queryMatch) {
                toolArgs = { query: queryMatch[1] };
            } else if (rawName === 'search_project_knowledge' || normalizeToolName(rawName)) {
                const cleaned = rawArgs.replace(/^[\[\{]+|[\]\}]+$/g, '').trim();
                if (cleaned) toolArgs = { query: cleaned.slice(0, 120) };
            }
        }

        if (!toolArgs) continue;

        const canonical = normalizeToolName(rawName);
        if (!canonical) continue;

        return { toolName: canonical, toolArgs };
    }

    return null;
}

function recoverToolCallFromError(error, allowedToolNames = null) {
    if (!isGroqToolUseFailedError(error)) return null;

    const failedGeneration = extractFailedGeneration(error);
    const parsed = parseFailedToolGeneration(failedGeneration);
    if (!parsed) return null;

    const normalized = normalizeToolName(parsed.toolName, allowedToolNames);
    if (!normalized) {
        console.warn('[Agent] Recovered tool not in allowed set:', parsed.toolName);
        return null;
    }

    return { toolName: normalized, toolArgs: parsed.toolArgs };
}

function isGroqToolUseFailedError(error) {
    const message = error?.message || '';
    return message.includes('tool_use_failed') || error?.error?.code === 'tool_use_failed';
}

function extractFailedGeneration(error) {
    if (error?.error?.failed_generation) {
        return error.error.failed_generation;
    }

    try {
        const parsed = JSON.parse(error.message.replace(/^\d+\s+/, ''));
        return parsed?.error?.failed_generation || null;
    } catch (parseError) {
        const match = (error.message || '').match(/failed_generation":"([^"]+)"/);
        return match ? match[1] : null;
    }
}

function isInvalidToolInRequestError(error) {
    const message = error?.message || '';
    return message.includes('was not in request.tools') ||
        message.includes('not in request.tools');
}

module.exports = {
    parseFailedToolGeneration,
    recoverToolCallFromError,
    isGroqToolUseFailedError,
    isInvalidToolInRequestError,
    extractFailedGeneration,
    ALL_CANONICAL_TOOLS
};
