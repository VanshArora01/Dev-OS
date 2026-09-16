const nodemailer = require('nodemailer');
const Project = require('../models/Project');
const User = require('../models/User');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

exports.sendEmail = async (to, subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"DevOS" <no-reply@devos.dev>',
            to,
            subject,
            text,
            html: html || text.replace(/\n/g, '<br>')
        });
        console.log('Email sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
};

exports.sendEmailWithAttachment = async (to, subject, text, attachment) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"DevOS" <no-reply@devos.dev>',
            to,
            subject,
            text,
            html: text.replace(/\n/g, '<br>'),
            attachments: [{
                filename: attachment.filename,
                content: attachment.buffer,
                contentType: attachment.mimeType
            }]
        });
        console.log('Email with attachment sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email with attachment:', error);
        return { success: false, error: error.message };
    }
};


exports.sendReminderEmail = async (userEmail, projectName, nextStep) => {
    // Basic verification of credentials
    if (!process.env.SMTP_USER || process.env.SMTP_USER.includes('your_')) {
        console.warn('Email check skipped: SMTP credentials not configured correctly in .env');
        return false;
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"DevOS System" <reminders@devos.dev>',
            to: userEmail,
            subject: `You haven't worked on ${projectName}`,
            text: `It's time to get back to work! Your last planned step was: ${nextStep || 'No plan recorded.'}`,
            html: `<p>It's time to get back to work!</p><p><b>Project:</b> ${projectName}</p><p><b>Your last planned step was:</b> ${nextStep || 'No plan recorded.'}</p>`,
        });

        console.log("Message sent: %s", info.messageId);
        return true;
    } catch (error) {
        if (error.code === 'EAUTH') {
            console.error("Email Authentication Failed: Check your SMTP credentials in .env");
        } else {
            console.error("Error sending email:", error.message);
        }
        return false;
    }
};

exports.checkReminders = async () => {
    console.log("Running background reminder check...");
    try {
        const now = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(now.getDate() + 3);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);

        // 1. Find projects near deadline or inactive
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
            if (user && user.clerkId) {
                // In a real app, we'd fetch email from Clerk or our DB
                // Assuming displayName or a mock email for now
                const email = "developer@example.com";
                await this.sendReminderEmail(email, project.name, project.nextPlannedStep);

                // Mark reminders as sent
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
