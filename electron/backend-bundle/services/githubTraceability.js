function tokenize(text) {
    return String(text || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s\-_/]/g, ' ')
        .split(/\s+/)
        .filter((token) => token.length >= 3 && !['the', 'and', 'for', 'with', 'from', 'this', 'that'].includes(token));
}

function overlapScore(left, right) {
    const a = new Set(tokenize(left));
    const b = new Set(tokenize(right));
    if (!a.size || !b.size) return 0;
    let hits = 0;
    for (const token of a) {
        if (b.has(token)) hits += 1;
    }
    return hits / Math.max(a.size, 1);
}

function extractExplicitRefs(text) {
    const source = String(text || '');
    const refs = [];
    const issue = source.match(/#(\d+)/g) || [];
    issue.forEach((item) => refs.push({ type: 'issue_or_pr', value: item }));
    const fr = source.match(/\bFR[-_ ]?\d+\b/gi) || [];
    fr.forEach((item) => refs.push({ type: 'requirement', value: item.toUpperCase() }));
    const task = source.match(/\b(?:task|milestone)[:\s]+([^\n,]{3,80})/gi) || [];
    task.forEach((item) => refs.push({ type: 'task', value: item }));
    return refs;
}

function inferTraceability(githubItem, project) {
    const blob = [
        githubItem.title,
        githubItem.message,
        githubItem.body,
        githubItem.description,
        githubItem.branch,
        githubItem.head,
        ...(githubItem.files || [])
    ].filter(Boolean).join('\n');

    const explicit = extractExplicitRefs(blob);
    const matches = [];

    const requirements = project?.blueprint?.requirements || [];
    requirements.forEach((req) => {
        const title = req.title || req.id || '';
        const id = String(req.id || req.source || '');
        const explicitHit = explicit.some((ref) =>
            (ref.value || '').toLowerCase().includes(String(id).toLowerCase())
            || blob.toLowerCase().includes(String(id).toLowerCase())
        );
        const score = overlapScore(blob, `${title} ${req.description || ''}`);
        if (explicitHit || score >= 0.18) {
            matches.push({
                kind: 'requirement',
                id: req.id || null,
                title,
                confidence: explicitHit ? 'explicit' : 'inferred',
                evidence: explicitHit ? 'Referenced in GitHub description or commit message.' : 'Token overlap with requirement text.'
            });
        }
    });

    const milestones = project?.planning?.milestones || [];
    milestones.forEach((milestone) => {
        const score = overlapScore(blob, `${milestone.title} ${milestone.description || ''}`);
        const explicitHit = blob.toLowerCase().includes(String(milestone.title || '').toLowerCase());
        if (explicitHit && String(milestone.title || '').length >= 6) {
            matches.push({
                kind: 'task',
                title: milestone.title,
                status: milestone.status,
                confidence: 'inferred',
                evidence: 'Task title appears in GitHub text.'
            });
        } else if (score >= 0.22) {
            matches.push({
                kind: 'task',
                title: milestone.title,
                status: milestone.status,
                confidence: 'inferred',
                evidence: 'Token overlap with a DevOS task/milestone.'
            });
        }
    });

    if (project?.currentPhase && blob.toLowerCase().includes(String(project.currentPhase).toLowerCase())) {
        matches.push({
            kind: 'phase',
            title: project.currentPhase,
            confidence: 'inferred',
            evidence: 'Current project phase is mentioned in GitHub text.'
        });
    }

    return {
        matches: matches.slice(0, 8),
        explicitRefs: explicit.slice(0, 8)
    };
}

module.exports = {
    inferTraceability,
    extractExplicitRefs
};
