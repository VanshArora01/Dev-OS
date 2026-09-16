const { google } = require('googleapis');
const Project = require('../models/Project');
const User = require('../models/User');
const { getAuthenticatedClient, getIntegrationForUser } = require('./googleOAuthService');

function createEmailString(to, subject, html, attachments = []) {
    const boundary = 'devos_mail_boundary_' + Date.now().toString(16);
    let email = `To: ${to}\n`;
    email += `Subject: ${subject}\n`;
    email += `MIME-Version: 1.0\n`;
    
    if (attachments.length > 0) {
        email += `Content-Type: multipart/mixed; boundary=${boundary}\n\n`;
        email += `--${boundary}\n`;
        email += `Content-Type: text/html; charset=UTF-8\n\n${html}\n\n`;
        
        for (const att of attachments) {
            email += `--${boundary}\n`;
            email += `Content-Type: ${att.contentType}; name="${att.filename}"\n`;
            email += `Content-Transfer-Encoding: base64\n`;
            email += `Content-Disposition: attachment; filename="${att.filename}"\n\n`;
            email += `${att.buffer.toString('base64')}\n\n`;
        }
        email += `--${boundary}--\n`;
    } else {
        email += `Content-Type: text/html; charset=UTF-8\n\n${html}\n`;
    }
    
    // Base64url encode
    return Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

exports.sendEmail = async (userId, to, subject, text, html) => {
    try {
        const { oauth2Client } = await getAuthenticatedClient(userId);
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        
        const raw = createEmailString(to, subject, html || text.replace(/\n/g, '<br>'));
        
        const res = await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw }
        });
        
        console.log('Email sent via Gmail: %s', res.data.id);
        return { success: true, messageId: res.data.id };
    } catch (error) {
        if (error.code === 'DRIVE_NOT_CONNECTED' || error.code === 'DRIVE_RECONNECT_REQUIRED') {
            console.warn(`[Gmail] Skipping email for user ${userId}: ${error.message}`);
        } else {
            console.error('Error sending email via Gmail:', error);
        }
        return { success: false, error: error.message, code: error.code };
    }
};

exports.sendEmailWithAttachment = async (userId, to, subject, text, attachment) => {
    try {
        const { oauth2Client } = await getAuthenticatedClient(userId);
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        
        const raw = createEmailString(to, subject, text.replace(/\n/g, '<br>'), [{
            filename: attachment.filename,
            buffer: attachment.buffer,
            contentType: attachment.mimeType
        }]);
        
        const res = await gmail.users.messages.send({
            userId: 'me',
            requestBody: { raw }
        });
        
        console.log('Email with attachment sent via Gmail: %s', res.data.id);
        return { success: true, messageId: res.data.id };
    } catch (error) {
        if (error.code === 'DRIVE_NOT_CONNECTED' || error.code === 'DRIVE_RECONNECT_REQUIRED') {
            console.warn(`[Gmail] Skipping email for user ${userId}: ${error.message}`);
        } else {
            console.error('Error sending email with attachment via Gmail:', error);
        }
        return { success: false, error: error.message, code: error.code };
    }
};

exports.sendReminderEmail = async (userId, userEmail, projectName, nextStep) => {
    try {
        const subject = `You haven't worked on ${projectName}`;
        const text = `It's time to get back to work! Your last planned step was: ${nextStep || 'No plan recorded.'}`;
        const html = `<p>It's time to get back to work!</p><p><b>Project:</b> ${projectName}</p><p><b>Your last planned step was:</b> ${nextStep || 'No plan recorded.'}</p>`;
        
        const result = await this.sendEmail(userId, userEmail, subject, text, html);
        if (result.success) return true;
        
        console.warn("Reminder email not sent:", result.error);
        return false;
    } catch (error) {
        console.error("Error sending reminder email:", error.message);
        return false;
    }
};

exports.checkReminders = async () => {
    console.log("Running background reminder check...");
    try {
        const now = new Date();
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const projectsToRemind = await Project.find({
            status: 'active',
            $or: [
                { deadline: { $lte: threeDaysFromNow, $gte: now } },
                { lastWorkedAt: { $lt: sevenDaysAgo } },
                { "reminders.date": { $lte: now }, "reminders.sent": false }
            ]
        }).populate('userId');

        for (const project of projectsToRemind) {
            const user = project.userId;
            if (user && user._id) {
                // Pre-check if user has connected Google OAuth
                const integration = await getIntegrationForUser(user._id);
                if (!integration) {
                    console.log(`[Reminders] Skipping email for "${project.name}": Google account not connected for user ${user._id}`);
                    continue;
                }

                const email = user.email || 'developer@example.com';
                await this.sendReminderEmail(user._id, email, project.name, project.nextPlannedStep);

                project.reminders.forEach(r => {
                    if (r.date <= now) r.sent = true;
                });
                await project.save();
            }
        }
    } catch (error) {
        console.error("Reminder check failed:", error);
    }
};

