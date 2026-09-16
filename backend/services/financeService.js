/**
 * Deterministic Financial ROI Calculation Service for Climate Resilience
 */

const RISK_MULTIPLIERS = {
    'flood': 0.08,
    'heat': 0.05,
    'slr': 0.10,
    'default': 0.06
};

const INFRA_COST_PERCENTAGES = {
    'Hospital': 0.12,
    'Bridge': 0.15,
    'Road': 0.08,
    'School': 0.10,
    'default': 0.10
};

/**
 * Calculates all deterministic financial metrics for a project
 * @param {Object} params - Calculation parameters
 * @returns {Object} Calculated financial metrics
 */
const calculateROIMetrics = ({ budget, riskScore, hazard, infraType, lifespanYears = 20 }) => {
    // 1. Annual Loss Calculation
    const hazardKey = (hazard || '').toLowerCase();
    const multiplier = RISK_MULTIPLIERS[hazardKey] || RISK_MULTIPLIERS.default;
    const annualLoss = Math.round(riskScore * budget * multiplier);

    // 2. Total Risk Exposure
    const totalExposure = Math.round(annualLoss * lifespanYears);

    // 3. Mitigation Cost
    const infraKey = infraType || 'default';
    const costPercentage = INFRA_COST_PERCENTAGES[infraKey] || INFRA_COST_PERCENTAGES.default;
    const mitigationCost = Math.round(budget * costPercentage);

    // 4. Expected Savings
    const expectedSavings = Math.round(totalExposure - mitigationCost);

    // 5. ROI Multiple
    const roiMultiple = mitigationCost > 0 ? parseFloat((totalExposure / mitigationCost).toFixed(2)) : 0;

    // 6. Payback Period
    const paybackYears = annualLoss > 0 ? parseFloat((mitigationCost / annualLoss).toFixed(1)) : 0;

    return {
        annualLoss,
        totalExposure,
        mitigationCost,
        expectedSavings,
        roiMultiple,
        paybackYears,
        lifespanYears
    };
};

module.exports = {
    calculateROIMetrics
};
