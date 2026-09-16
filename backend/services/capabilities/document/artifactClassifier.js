const { ARTIFACT_TYPES, normalizeArtifactType } = require('./artifactTypes');

function classifyArtifactType(text = '', options = {}) {
    const explicit = normalizeArtifactType(options.artifact_type);
    if (explicit) return explicit;

    const s = String(text || '').toLowerCase();

    if (/\b(tech\s*stack|technology\s*stack|stack\s*document|technologies\s*used)\b/.test(s)) {
        return ARTIFACT_TYPES.TECH_STACK;
    }
    if (/\b(project\s*report|full\s*report|status\s*report)\b/.test(s) && !/\b(short|brief|update)\b/.test(s)) {
        return ARTIFACT_TYPES.PROJECT_REPORT;
    }
    if (/\b(status\s*update|short\s*status|progress\s*update)\b/.test(s)) {
        return ARTIFACT_TYPES.STATUS_UPDATE;
    }
    if (/\b(project\s*summary|executive\s*summary|overview\s*document)\b/.test(s)) {
        return ARTIFACT_TYPES.PROJECT_SUMMARY;
    }
    if (/\b(requirements?\s*(doc|document|spec)|functional\s*requirements?|fr-\d+)\b/.test(s)) {
        return ARTIFACT_TYPES.REQUIREMENTS;
    }
    if (/\b(weekly\s*standup|stand-?up|standup)\b/.test(s)) {
        return ARTIFACT_TYPES.STANDUP;
    }
    if (/\b(meeting\s*summary|decision\s*summary|action\s*items)\b/.test(s)) {
        return ARTIFACT_TYPES.MEETING_SUMMARY;
    }

    return ARTIFACT_TYPES.GENERIC;
}

module.exports = { classifyArtifactType };
