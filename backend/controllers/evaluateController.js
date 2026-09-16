const Project = require('../models/Project');
const { evaluateInfrastructure } = require('../services/nvidiaService');
const { calculateRiskDetails } = require('../services/riskService');
const { calculateROIMetrics } = require('../services/financeService');

exports.evaluate = async (req, res) => {
    try {
        const { location, infraType, year, budget, hazard, title, lifespanYears = 20, userEmail } = req.body;

        // 1. Call real NVIDIA AI Evaluation for recommendations
        // AI strictly provides strategies without financial hallucinations
        const aiRecommendationsMarkdown = await evaluateInfrastructure({
            infraType,
            location,
            hazard,
            year,
            budget
        });

        // 2. Compute Real Deterministic Risk Stats
        const riskDetails = calculateRiskDetails({
            infraType,
            year,
            budget
        });

        // 3. Compute Deterministic Financial ROI Metrics
        const financialMetrics = calculateROIMetrics({
            budget,
            riskScore: riskDetails.risk_score,
            hazard,
            infraType,
            lifespanYears
        });

        // 4. Create and save the project with all deterministic values
        const projectData = {
            title: title || `${infraType} Resilience - ${hazard.toUpperCase()}`,
            name: title || `${infraType} Protection`,
            location,
            infraType,
            year,
            hazard,
            hazardType: hazard,
            budget,
            lifespanYears,
            ...riskDetails,
            riskScore: riskDetails.risk_score, // 0-1 float as requested
            ...financialMetrics,
            kimiReport: aiRecommendationsMarkdown,
            aiRecommendations: [
                {
                    recommendation: "AI-Generated Resilience Strategies",
                    explanation: aiRecommendationsMarkdown // Store the full markdown or parse it
                }
            ],
            status: 'Active',
            userEmail: userEmail || '' // Store user email if provided
        };

        const newProject = new Project(projectData);
        const savedProject = await newProject.save();

        // Increment subscription usage
        const { userId, clerkId } = req.auth;
        if (clerkId) {
            const UserSubscription = require('../models/UserSubscription');
            await UserSubscription.findOneAndUpdate(
                { clerkId },
                { $inc: { evaluationsUsed: 1 } }
            );
        }

        // 5. Return structured response as per STEP 7
        res.status(201).json({
            projectId: savedProject._id,
            riskScore: savedProject.riskScore,
            annualLoss: savedProject.annualLoss,
            totalExposure: savedProject.totalExposure,
            mitigationCost: savedProject.mitigationCost,
            roiMultiple: savedProject.roiMultiple,
            paybackYears: savedProject.paybackYears,
            expectedSavings: savedProject.expectedSavings,
            aiRecommendations: aiRecommendationsMarkdown,
            reportUrl: `/api/report/${savedProject._id}`
        });
    } catch (err) {
        console.error('Evaluation Error:', err);
        res.status(500).json({ error: 'Evaluation failed: ' + err.message });
    }
};
