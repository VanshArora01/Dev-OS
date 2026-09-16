const jobs = new Map();

function jobKey(userId, projectId, owner, repo) {
    return `${userId}:${projectId}:${owner}/${repo}`;
}

function getIndexJob(userId, projectId, owner, repo) {
    return jobs.get(jobKey(userId, projectId, owner, repo)) || null;
}

function startIndexJob(userId, projectId, owner, repo) {
    const key = jobKey(userId, projectId, owner, repo);
    const existing = jobs.get(key);
    if (existing?.status === 'running') {
        return { job: existing, alreadyRunning: true };
    }
    const job = {
        key,
        status: 'running',
        indexedCount: 0,
        skippedCount: 0,
        fileCount: 0,
        percent: 0,
        error: null,
        startedAt: Date.now(),
        completedAt: null
    };
    jobs.set(key, job);
    return { job, alreadyRunning: false };
}

function updateIndexJob(userId, projectId, owner, repo, patch) {
    const job = jobs.get(jobKey(userId, projectId, owner, repo));
    if (!job) return null;
    Object.assign(job, patch);
    if (job.fileCount > 0) {
        job.percent = Math.min(100, Math.round(((job.indexedCount + job.skippedCount) / job.fileCount) * 100));
    }
    return job;
}

function publicIndexJob(job) {
    if (!job) return { status: 'idle', indexedCount: 0, skippedCount: 0, fileCount: 0, percent: 0 };
    return {
        status: job.status,
        indexedCount: job.indexedCount,
        skippedCount: job.skippedCount,
        fileCount: job.fileCount,
        percent: job.percent,
        error: job.error
    };
}

module.exports = {
    getIndexJob,
    startIndexJob,
    updateIndexJob,
    publicIndexJob
};
