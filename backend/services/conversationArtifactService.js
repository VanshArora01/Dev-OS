const Conversation = require('../models/Conversation');

function buildArtifactDownloadPath(artifactId, projectId) {
    const base = process.env.BACKEND_URL || process.env.API_BASE_URL || 'http://localhost:5000';
    return `${base.replace(/\/$/, '')}/api/ai/artifacts/${artifactId}/download?projectId=${projectId}`;
}

function buildArtifactRecord(artifact, projectId) {
    if (!artifact?.artifact_id) return null;
    const fileName = artifact.file_name || artifact.fileName;
    const mimeType = artifact.mime_type || artifact.mimeType;
    const format = artifact.format || (fileName?.endsWith('.pdf') ? 'pdf' : 'docx');
    return {
        artifact_id: artifact.artifact_id,
        file_name: fileName,
        mime_type: mimeType,
        format,
        size: artifact.size,
        download_url: buildArtifactDownloadPath(artifact.artifact_id, projectId),
        created_at: new Date()
    };
}

async function getConversationArtifact(conversationId) {
    if (!conversationId) return null;
    const conversation = await Conversation.findById(conversationId).select('currentArtifact').lean();
    return conversation?.currentArtifact || null;
}

async function setConversationArtifact(conversationId, artifact, projectId) {
    if (!conversationId || !artifact?.artifact_id) return null;
    const record = buildArtifactRecord(artifact, projectId);
    await Conversation.findByIdAndUpdate(conversationId, { currentArtifact: record });
    return record;
}

async function clearConversationArtifact(conversationId) {
    if (!conversationId) return;
    await Conversation.findByIdAndUpdate(conversationId, { currentArtifact: null });
}

function buildArtifactActionCards(artifact, extras = {}) {
    if (!artifact?.artifact_id) return [];
    const cards = [{
        type: 'download',
        label: artifact.format === 'pdf' ? 'Generated PDF document' : 'Generated Word document',
        file_name: artifact.file_name,
        download_url: artifact.download_url
    }];
    if (extras.drive_url) {
        cards.push({
            type: 'drive',
            label: 'Uploaded to Google Drive',
            url: extras.drive_url,
            file_name: extras.drive_file_name || artifact.file_name
        });
    }
    if (extras.email_to) {
        cards.push({
            type: 'email',
            label: `Emailed to ${extras.email_to}`,
            success: extras.email_success !== false
        });
    }
    return cards;
}

module.exports = {
    buildArtifactDownloadPath,
    buildArtifactRecord,
    getConversationArtifact,
    setConversationArtifact,
    clearConversationArtifact,
    buildArtifactActionCards
};
