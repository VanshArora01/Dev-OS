const { RiskLog, Alert } = require('../services/mockDb');
const { calculateRiskDetails, mockAssetRegistry } = require('../services/riskService');
const axios = require('axios');

exports.runRiskScan = async (req, res) => {
    try {
        const { asset_id, force_high_risk } = req.body;

        // 1. Fetch asset attributes
        const assetAttrs = mockAssetRegistry[asset_id] || mockAssetRegistry["A12"];

        // 2. Setup hazard inputs if forcing high risk
        let hazardInputs = null;
        if (force_high_risk) {
            hazardInputs = {
                flood_depth_meters: 2.0,
                rainfall_mm: 300,
                river_discharge_index: 0.9
            };
        }

        // 3. Compute detailed risk using service
        const riskDetails = calculateRiskDetails(assetAttrs, hazardInputs);

        // 4. Store Detailed Breakdown
        await RiskLog.save({
            asset_id,
            ...riskDetails,
            timestamp: new Date()
        });

        // 5. Trigger n8n Webhook if High Risk
        let alert_triggered = false;
        let alert_status = "NOT_TRIGGERED";

        if (riskDetails.risk_score > 0.85) {
            alert_triggered = true;
            try {
                const webhookUrl = 'https://johnjacob77.app.n8n.cloud/webhook/climate-risk-alert';
                const payload = {
                    asset_id,
                    ...riskDetails,
                    recommendation: `Immediate intervention suggested for ${riskDetails.asset_details.asset_type} due to high ${riskDetails.risk_level} risk.`
                };

                console.log(`[RiskEngine] Sending webhook to ${webhookUrl}...`);
                const webhookResponse = await axios.post(webhookUrl, payload, { timeout: 5000 });
                console.log(`[RiskEngine] Webhook response: ${webhookResponse.status}`);
                alert_status = webhookResponse.status === 200 ? "CREATED" : "FAILED";
            } catch (error) {
                console.error('[RiskEngine] Webhook Error:', error.message);
                alert_status = "FAILED";
            }

            // Store alert record
            await Alert.save({
                asset_id,
                risk_score: riskDetails.risk_score,
                risk_level: riskDetails.risk_level,
                alert_status
            });
        }

        // 6. Return response
        res.json({
            asset_id,
            ...riskDetails,
            alert_triggered,
            alert_status
        });

    } catch (err) {
        console.error('Risk Scan Error:', err);
        res.status(500).json({ error: 'Risk scan failed: ' + err.message });
    }
};
