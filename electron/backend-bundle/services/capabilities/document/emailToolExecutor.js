const { sendEmailWithAttachment } = require('../../emailService');
const { readArtifactBuffer } = require('./artifactStore');
const { validateArtifactForUpload } = require('./artifactValidation');
const { isValidArtifactIdFormat } = require('./artifactValidation');

async function executeEmailTool(toolName, toolArgs, context) {
    const { userId, projectId, project, currentArtifact } = context;

    if (toolName !== 'send_document_email') {
        return {
            success: false,
            error: { code: 'UNKNOWN_TOOL', message: `Unknown email tool: ${toolName}`, retryable: false }
        };
    }

    let artifactId = toolArgs.artifact_id;
    if (!isValidArtifactIdFormat(artifactId) && currentArtifact?.artifact_id) {
        artifactId = currentArtifact.artifact_id;
    }

    const validation = validateArtifactForUpload(userId, projectId, artifactId);
    if (!validation.valid) {
        return { success: false, error: validation.error };
    }

    const recipient = String(toolArgs.recipient_email || '').trim();
    if (!recipient || !recipient.includes('@')) {
        return {
            success: false,
            error: { code: 'INVALID_EMAIL', message: 'A valid recipient_email is required.', retryable: true }
        };
    }

    const artifact = readArtifactBuffer(userId, projectId, artifactId);
    const subject = toolArgs.subject || `${project?.name || 'DevOS'} — ${artifact.fileName}`;
    const greeting = toolArgs.greeting || 'Hi,';
    const message = toolArgs.message || 'Please find the attached document.';
    const signoff = toolArgs.signoff || 'Best regards';
    const senderName = toolArgs.sender_name || project?.name || 'DevOS User';

    const body = `${greeting}\n\n${message}\n\n${signoff},\n${senderName}`;

    const result = await sendEmailWithAttachment(recipient, subject, body, {
        filename: artifact.fileName,
        buffer: artifact.buffer,
        mimeType: artifact.mimeType
    });

    if (!result.success) {
        return {
            success: false,
            error: {
                code: 'EMAIL_FAILED',
                message: result.error || 'Failed to send email.',
                retryable: true
            }
        };
    }

    return {
        success: true,
        emailed_to: recipient,
        subject,
        file_name: artifact.fileName,
        artifact_id: artifactId
    };
}

module.exports = { executeEmailTool };
