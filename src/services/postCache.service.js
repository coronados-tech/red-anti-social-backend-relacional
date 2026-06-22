const enabled = process.env.CACHE_POSTS_ENABLED !== "false";
const ttlMs = Math.max(1, Number(process.env.CACHE_POSTS_TTL_SECONDS || 60)) * 1000;

const store = new Map();

const isExpired = (entry) => Date.now() > entry.expiresAt;

const get = (key) => {
    if (!enabled) return null;

    const entry = store.get(key);
    if (!entry) return null;

    if (isExpired(entry)) {
        store.delete(key);
        return null;
    }

    return entry.data;
};

const set = (key, data) => {
    if (!enabled) return;

    store.set(key, {
        data,
        expiresAt: Date.now() + ttlMs,
    });
};

const invalidateLists = () => {
    for (const key of store.keys()) {
        if (key.startsWith("posts:")) {
            store.delete(key);
        }
    }
};

const deletePost = (id) => {
    store.delete(`post:${id}`);
    invalidateLists();
};

const deleteAll = () => {
    store.clear();
};

module.exports = {
    get,
    set,
    deletePost: deletePost,
    deleteAll: deleteAll,
    isEnabled: () => enabled,
    ttlSeconds: () => ttlMs / 1000,
};
