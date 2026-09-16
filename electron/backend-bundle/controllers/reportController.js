const PDFDocument = require('pdfkit');
const Project = require('../models/Project');
const { sendReportEmail } = require('../services/emailService');
const path = require('path');
const fs = require('fs');

// Ensure reports directory exists
const reportsDir = path.join(__dirname, '..', 'reports');
if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
}

exports.generateReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { email } = req.body;

        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        if (!project.kimiReport) {
            return res.status(400).json({ error: 'No AI report available. Run simulation first.' });
        }

        // Save email if provided
        if (email) {
            project.userEmail = email;
        }

        project.reportStatus = 'generating';
        await project.save();

        // Generate PDF
        const pdfBuffer = await createPDF(project);
        const filename = `${project.title?.replace(/[^a-zA-Z0-9]/g, '_') || 'Report'}_${Date.now()}.pdf`;
        const pdfPath = path.join(reportsDir, filename);

        // Save to disk
        fs.writeFileSync(pdfPath, pdfBuffer);

        // Update project
        project.reportStatus = 'completed';
        project.reportPath = filename;
        await project.save();

        // Send email if address provided
        let emailResult = { sent: false };
        const recipientEmail = email || project.userEmail;
        if (recipientEmail) {
            emailResult = await sendReportEmail(
                recipientEmail,
                project.title || 'ClimX-X Report',
                pdfBuffer
            );
        }

        res.json({
            success: true,
            reportPath: filename,
            emailSent: emailResult.sent,
            message: emailResult.sent
                ? `Report generated and emailed to ${recipientEmail}`
                : 'Report generated successfully'
        });
    } catch (err) {
        console.error('Report generation failed:', err);
        try {
            await Project.findByIdAndUpdate(req.params.id, { reportStatus: 'failed' });
        } catch (e) { /* ignore */ }
        res.status(500).json({ error: 'Report generation failed: ' + err.message });
    }
};

exports.downloadReport = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        if (!project.reportPath) {
            return res.status(404).json({ error: 'No report file available' });
        }

        const filePath = path.join(reportsDir, project.reportPath);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Report file not found on disk' });
        }

        res.download(filePath, `${project.title || 'ClimX-X_Report'}.pdf`);
    } catch (err) {
        console.error('Report download failed:', err);
        res.status(500).json({ error: 'Download failed: ' + err.message });
    }
};

function createPDF(project) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 60, bottom: 60, left: 50, right: 50 },
                info: {
                    Title: `${project.title} - Climate Resilience Report`,
                    Author: 'ClimX-X Intelligence Platform',
                    Subject: 'Climate Risk Assessment',
                }
            });

            const buffers = [];
            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // ─── Header ────────────────────────────────
            doc.rect(0, 0, doc.page.width, 120).fill('#0A0A0B');
            doc.fillColor('#FFFFFF')
                .fontSize(28)
                .font('Helvetica-Bold')
                .text('CLIMX-X', 50, 35, { continued: false });
            doc.fillColor('#666666')
                .fontSize(9)
                .font('Helvetica')
                .text('CLIMATE RESILIENCE INTELLIGENCE PLATFORM', 50, 70);
            doc.fillColor('#444444')
                .fontSize(8)
                .text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, 50, 90);

            doc.moveDown(3);

            // ─── Project Metadata ──────────────────────
            const metaY = 140;
            doc.rect(50, metaY, doc.page.width - 100, 100).fill('#F5F5F5');

            doc.fillColor('#000000').fontSize(16).font('Helvetica-Bold')
                .text(project.title || 'Infrastructure Assessment', 65, metaY + 15);

            doc.fillColor('#555555').fontSize(9).font('Helvetica');
            const col1x = 65, col2x = 280;

            doc.text(`Infrastructure: ${project.infraType || 'N/A'}`, col1x, metaY + 42);
            doc.text(`Target Year: ${project.year || 'N/A'}`, col2x, metaY + 42);
            doc.text(`Budget: ₹${(project.budget || 0).toLocaleString('en-IN')}`, col1x, metaY + 58);
            doc.text(`Risk Level: ${project.riskLevel || 'N/A'}`, col2x, metaY + 58);

            const city = project.locationDetails?.city || project.location?.city || 'N/A';
            const country = project.locationDetails?.country || 'N/A';
            doc.text(`Location: ${city}, ${country}`, col1x, metaY + 74);

            if (project.riskScore) {
                doc.text(`Risk Score: ${project.riskScore}/100`, col2x, metaY + 74);
            }

            doc.moveDown(4);

            // ─── Kimi K2.5 Report Content ──────────────
            const reportContent = project.kimiReport || 'No AI analysis available.';
            const lines = reportContent.split('\n');
            let currentY = metaY + 120;

            for (const line of lines) {
                if (currentY > doc.page.height - 80) {
                    doc.addPage();
                    currentY = 60;
                }

                const trimmed = line.trim();

                if (trimmed.startsWith('# ')) {
                    // H1
                    doc.fillColor('#0A0A0B').fontSize(16).font('Helvetica-Bold')
                        .text(trimmed.replace(/^#+\s*/, ''), 50, currentY);
                    currentY += 28;
                    // Underline
                    doc.moveTo(50, currentY - 5).lineTo(doc.page.width - 50, currentY - 5).stroke('#E0E0E0');
                    currentY += 5;
                } else if (trimmed.startsWith('## ')) {
                    // H2
                    currentY += 5;
                    doc.fillColor('#222222').fontSize(13).font('Helvetica-Bold')
                        .text(trimmed.replace(/^#+\s*/, ''), 50, currentY);
                    currentY += 22;
                } else if (trimmed.startsWith('### ')) {
                    // H3
                    currentY += 3;
                    doc.fillColor('#333333').fontSize(11).font('Helvetica-Bold')
                        .text(trimmed.replace(/^#+\s*/, ''), 50, currentY);
                    currentY += 18;
                } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                    // Bullet
                    const bulletText = trimmed.replace(/^[-*]\s*/, '').replace(/\*\*/g, '');
                    doc.fillColor('#444444').fontSize(10).font('Helvetica')
                        .text('•  ' + bulletText, 60, currentY, { width: doc.page.width - 120 });
                    currentY += doc.heightOfString('•  ' + bulletText, { width: doc.page.width - 120 }) + 6;
                } else if (/^\d+\./.test(trimmed)) {
                    // Numbered list
                    const itemText = trimmed.replace(/\*\*/g, '');
                    doc.fillColor('#444444').fontSize(10).font('Helvetica')
                        .text(itemText, 60, currentY, { width: doc.page.width - 120 });
                    currentY += doc.heightOfString(itemText, { width: doc.page.width - 120 }) + 6;
                } else if (trimmed.startsWith('RESILIENCE SCORE')) {
                    // Highlight the resilience score
                    currentY += 10;
                    doc.rect(50, currentY, doc.page.width - 100, 40).fill('#0A0A0B');
                    doc.fillColor('#FFFFFF').fontSize(14).font('Helvetica-Bold')
                        .text(trimmed, 65, currentY + 12);
                    currentY += 55;
                } else if (trimmed.startsWith('---')) {
                    doc.moveTo(50, currentY + 5).lineTo(doc.page.width - 50, currentY + 5).stroke('#DDDDDD');
                    currentY += 15;
                } else if (trimmed.startsWith('>')) {
                    // Blockquote
                    const quoteText = trimmed.replace(/^>\s*/, '').replace(/\*\*/g, '');
                    doc.rect(50, currentY, 3, 30).fill('#CCCCCC');
                    doc.fillColor('#666666').fontSize(9).font('Helvetica-Oblique')
                        .text(quoteText, 62, currentY + 4, { width: doc.page.width - 130 });
                    currentY += doc.heightOfString(quoteText, { width: doc.page.width - 130 }) + 15;
                } else if (trimmed === '') {
                    currentY += 8;
                } else {
                    // Normal text
                    const cleanText = trimmed.replace(/\*\*/g, '');
                    doc.fillColor('#333333').fontSize(10).font('Helvetica')
                        .text(cleanText, 50, currentY, { width: doc.page.width - 100 });
                    currentY += doc.heightOfString(cleanText, { width: doc.page.width - 100 }) + 6;
                }
            }

            // ─── Footer ───────────────────────────────
            doc.addPage();
            doc.rect(0, doc.page.height - 60, doc.page.width, 60).fill('#0A0A0B');
            doc.fillColor('#666666').fontSize(8).font('Helvetica')
                .text('ClimX-X Climate Resilience Intelligence Platform | Powered by Kimi K2.5 Engine', 50, doc.page.height - 40, { align: 'center' });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
}
