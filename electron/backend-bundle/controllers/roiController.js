const { calculateROIMetrics } = require('../services/financeService');

exports.calculateROI = async (req, res) => {
    try {
        const {
            budget,
            riskScore, // 0-1 or 0-100 (we'll handle both)
            hazard,
            infraType,
            lifespanYears = 20
        } = req.body;

        // Ensure riskScore is a 0-1 float
        const normalizedRiskScore = riskScore > 1 ? riskScore / 100 : riskScore;

        const results = calculateROIMetrics({
            budget,
            riskScore: normalizedRiskScore,
            hazard,
            infraType,
            lifespanYears
        });

        res.json({
            ...results,
            riskScorePercentage: (normalizedRiskScore * 100).toFixed(0)
        });

    } catch (err) {
        console.error('ROI Calculation Error:', err);
        res.status(500).json({ error: 'ROI calculation failed: ' + err.message });
    }
};
