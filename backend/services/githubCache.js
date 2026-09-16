const store = new Map();

function cacheKey(parts) {
    return parts.map((part) => String(part ?? '')).join('::');
}

function getCached(key) {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return null;
    }
    return { value: entry.value, stale: false };
}

function setCached(key, value, ttlMs) {
    store.set(key, {
        value,
        expiresAt: Date.now() + ttlMs
    });
    return value;
}

function invalidatePrefix(prefix) {
    for (const key of store.keys()) {
        if (key.startsWith(prefix)) {
            store.delete(key);
        }
    }
}

module.exports = {
    cacheKey,
    getCached,
    setCached,
    invalidatePrefix
};
