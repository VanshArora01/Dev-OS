const Project = require('../models/Project');
const { evaluateInfrastructure } = require('../services/nvidiaService');
const { calculateROIMetrics } = require('../services/financeService');
const { calculateRiskDetails } = require('../services/riskService');

exports.simulate = async (req, res) => {
    try {
        const { id } = req.params;
        const { moreInfo, email } = req.body;

        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        // Save user email if provided
        if (email) {
            project.userEmail = email;
        }

        // Update report status to generating
        project.reportStatus = 'generating';
        await project.save();

        const markers = project.markers || [];
        const coordinatesText = markers.map(m => `[${m.lat.toFixed(4)}, ${m.lng.toFixed(4)}]`).join(', ');

        // Merge locationDetails into location for richer context
        const locationWithDetails = {
            city: project.locationDetails?.city || project.location?.city || '',
            state: project.locationDetails?.state || project.location?.state || '',
            country: project.locationDetails?.country || ''
        };

        const aiReport = await evaluateInfrastructure({
            infraType: project.infraType,
            location: locationWithDetails,
            hazard: project.hazard || project.hazardType,
            year: project.year,
            budget: project.budget,
            coordinates: coordinatesText,
            additionalContext: moreInfo
        });

        // 2. Fetch Risk Scores (for annual loss calculation)
        const riskDetails = await calculateRiskDetails(
            project.location?.lat || 0,
            project.location?.lng || 0,
            project.hazard || project.hazardType || 'Flood'
        );

        // 3. Compute Deterministic Financial ROI Metrics
        const financialMetrics = calculateROIMetrics({
            budget: project.budget,
            riskScore: riskDetails.risk_score,
            hazard: project.hazard || project.hazardType,
            infraType: project.infraType,
            lifespanYears: project.lifespanYears || 20
        });

        // Update project with all metrics
        project.kimiReport = aiReport;
        project.riskScore = riskDetails.risk_score;
        project.riskLevel = riskDetails.risk_level;

        // Map financial metrics to project fields
        project.annualLoss = financialMetrics.annualLoss;
        project.totalExposure = financialMetrics.totalExposure;
        project.mitigationCost = financialMetrics.mitigationCost;
        project.roiMultiple = financialMetrics.roiMultiple;
        project.paybackYears = financialMetrics.paybackYears;
        project.expectedSavings = financialMetrics.expectedSavings;

        project.reportStatus = 'completed';
        await project.save();

        res.json({
            success: true,
            report: aiReport,
            metrics: financialMetrics
        });
    } catch (err) {
        console.error("Simulation failed:", err);
        // Try to update status to failed
        try {
            const { id } = req.params;
            await Project.findByIdAndUpdate(id, { reportStatus: 'failed' });
        } catch (e) { /* ignore */ }
        res.status(500).json({ error: 'Simulation failed: ' + err.message });
    }
};
