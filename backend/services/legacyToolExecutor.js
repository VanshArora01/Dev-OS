const Project = require('../models/Project');
const Session = require('../models/Session');
const { sendEmail } = require('./emailService');

const { config } = require('../config/ai');

const GROQ_MODEL = config.complexAgentModel;

async function executeLegacyTool(toolName, toolArgs, context) {
    const { projectId, userId, project, groq } = context;

    if (toolName === 'create_reminder') {
        const reminderDate = new Date(toolArgs.date);
        await Project.findByIdAndUpdate(projectId, {
            $push: { reminders: { message: toolArgs.message, date: reminderDate } }
        });
        try {
            await sendEmail(
                userId,
                process.env.SMTP_FROM,
                `Reminder Set — ${project.name}`,
                `Reminder for ${reminderDate.toDateString()}: "${toolArgs.message}"`
            );
        } catch (e) {
            console.error('Email failed:', e.message);
        }
        return { success: true, message: `Reminder set for ${reminderDate.toDateString()}` };
    }

    if (toolName === 'mark_milestone_done') {
        await Project.findOneAndUpdate(
            { _id: projectId, 'planning.milestones.title': { $regex: toolArgs.milestone_title, $options: 'i' } },
            { $set: { 'planning.milestones.$.status': 'completed' } }
        );
        try {
            await sendEmail(
                userId,
                process.env.SMTP_FROM,
                `Milestone Complete — ${project.name}`,
                `Milestone "${toolArgs.milestone_title}" marked complete.`
            );
        } catch (e) {
            console.error('Email failed:', e.message);
        }
        return { success: true, message: `Milestone "${toolArgs.milestone_title}" marked complete` };
    }

    if (toolName === 'log_work_session') {
        await Session.create({
            projectId,
            userId,
            summary: toolArgs.summary,
            problems: toolArgs.problems || '',
            decisions: toolArgs.decisions || '',
            nextStep: toolArgs.next_step,
            durationMinutes: Number(toolArgs.minutes) || 0
        });
        try {
            await sendEmail(
                userId,
                process.env.SMTP_FROM,
                `Session Logged — ${project.name}`,
                `Summary: ${toolArgs.summary}\nNext Step: ${toolArgs.next_step}\nTime: ${Number(toolArgs.minutes) || 0} mins`
            );
        } catch (e) {
            console.error('Email failed:', e.message);
        }
        return { success: true, message: 'Session logged successfully' };
    }

    if (toolName === 'send_standup_email') {
        const recentSessions = await Session.find({ projectId }).sort({ createdAt: -1 }).limit(7);
        const standupPrompt = `Generate a professional standup email from these dev sessions: ${JSON.stringify(recentSessions)}. Include: What was completed, Blockers faced, Decisions made, Next steps.`;
        const standupResponse = await groq.chat.completions.create({
            model: GROQ_MODEL,
            messages: [{ role: 'user', content: standupPrompt }]
        });
        const standupContent = standupResponse.choices[0].message.content;
        try {
            await sendEmail(
                userId,
                toolArgs.recipient_email,
                `Weekly Standup — ${project.name} — ${new Date().toDateString()}`,
                standupContent
            );
        } catch (e) {
            console.error('Email failed:', e.message);
        }
        return { success: true, message: `Standup sent to ${toolArgs.recipient_email}` };
    }

    return { success: false, error: `Unknown tool: ${toolName}` };
}

module.exports = { executeLegacyTool };
