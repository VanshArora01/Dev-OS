const ARTIFACT_TYPES = {
    TECH_STACK: 'tech_stack',
    PROJECT_REPORT: 'project_report',
    STATUS_UPDATE: 'status_update',
    PROJECT_SUMMARY: 'project_summary',
    REQUIREMENTS: 'requirements',
    STANDUP: 'standup',
    MEETING_SUMMARY: 'meeting_summary',
    GENERIC: 'generic'
};

const ARTIFACT_TYPE_LABELS = {
    tech_stack: 'Technology Stack',
    project_report: 'Project Report',
    status_update: 'Project Status Update',
    project_summary: 'Project Summary',
    requirements: 'Project Requirements',
    standup: 'Weekly Standup',
    meeting_summary: 'Meeting Summary',
    generic: 'Document'
};

const VALID_ARTIFACT_TYPES = new Set(Object.values(ARTIFACT_TYPES));

function normalizeArtifactType(value) {
    const raw = String(value || '').trim().toLowerCase().replace(/\s+/g, '_');
    if (VALID_ARTIFACT_TYPES.has(raw)) return raw;
    return null;
}

module.exports = {
    ARTIFACT_TYPES,
    ARTIFACT_TYPE_LABELS,
    VALID_ARTIFACT_TYPES,
    normalizeArtifactType
};
