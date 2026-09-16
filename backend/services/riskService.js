// Helper: Normalization Function
const norm = (x, min, max) => {
    if (max === min) return 0;
    const result = (x - min) / (max - min);
    return Math.min(Math.max(result, 0), 1);
};

// Mock Asset Registry (for defaults/demo)
const mockAssetRegistry = {
    "Bridge": { asset_type: "Bridge", traffic_level: "High", material: "Concrete", drainage_quality: "Moderate", age_years: 15, elevation_meters: 2 },
    "Highway Road": { asset_type: "Highway Road", traffic_level: "Medium", material: "Asphalt", drainage_quality: "Poor", age_years: 30, elevation_meters: 1 },
    "Urban Road": { asset_type: "Urban Road", traffic_level: "Low", material: "Concrete", drainage_quality: "Good", age_years: 5, elevation_meters: 5 }
};

const calculateRiskDetails = (assetData, hazardInputs = null) => {
    // 1. Fetch asset attributes or use defaults
    const asset = {
        asset_type: assetData.infraType || assetData.asset_type || "Urban Road",
        traffic_level: assetData.traffic_level || "Medium",
        material: assetData.material || (assetData.infraType === "Highway Road" ? "Asphalt" : "Concrete"),
        drainage_quality: assetData.drainage_quality || "Moderate",
        age_years: assetData.age_years || 20,
        elevation_meters: assetData.elevation_meters || 2
    };

    // 2. Generate/Use hazard data
    const hazardData = hazardInputs || {
        flood_depth_meters: Number((Math.random() * 2).toFixed(2)),
        rainfall_mm: Number((Math.random() * 300).toFixed(2)),
        river_discharge_index: Number(Math.random().toFixed(2))
    };

    // 3. Calculate Hazard Score
    const flood_norm = norm(hazardData.flood_depth_meters, 0, 2);
    const rain_norm = norm(hazardData.rainfall_mm, 0, 300);
    const river_norm = hazardData.river_discharge_index;
    const hazard_score = (0.5 * flood_norm) + (0.3 * rain_norm) + (0.2 * river_norm);

    // 4. Calculate Exposure Score
    const baseExposures = { "Bridge": 0.9, "Highway Road": 0.8, "Urban Road": 0.6 };
    const trafficModifiers = { "High": 0.1, "Medium": 0.05, "Low": 0 };

    let exposure_score = (baseExposures[asset.asset_type] || 0.6) + (trafficModifiers[asset.traffic_level] || 0);
    exposure_score = Math.min(exposure_score, 1.0);

    // 5. Calculate Vulnerability Score
    const elevation_difference = hazardData.flood_depth_meters - asset.elevation_meters;
    const elevation_risk = elevation_difference <= 0 ? 0 : norm(elevation_difference, 0, 2);

    const materialFactors = { "Concrete": 0.4, "Asphalt": 0.7 };
    const drainageFactors = { "Good": 0.3, "Moderate": 0.6, "Poor": 0.9 };

    const material_factor = materialFactors[asset.material] || 0.5;
    const drainage_factor = drainageFactors[asset.drainage_quality] || 0.6;
    const age_factor = norm(asset.age_years, 0, 50);

    const vulnerability_score = (0.4 * elevation_risk) + (0.2 * material_factor) + (0.2 * drainage_factor) + (0.2 * age_factor);
    const vulnerability_clamped = Math.min(Math.max(vulnerability_score, 0), 1);

    // 6. Apply Flood Probability Index (FPI)
    const historical_flood_events = Math.floor(Math.random() * 20) + 1;
    const years_of_data = 20;
    const FPI = historical_flood_events / years_of_data;
    const hazard_adjusted = hazard_score * (1 + (0.5 * FPI));

    // 7. Compute Final Risk Score
    const risk_score = (0.4 * hazard_adjusted) + (0.3 * exposure_score) + (0.3 * vulnerability_clamped);
    const risk_score_final = Number(Math.min(risk_score, 1.0).toFixed(2));

    // 8. Risk Classification
    let risk_level = "LOW";
    if (risk_score_final > 0.85) risk_level = "HIGH";
    else if (risk_score_final > 0.6) risk_level = "MEDIUM";

    return {
        hazard_score: Number(hazard_adjusted.toFixed(2)),
        exposure_score: Number(exposure_score.toFixed(2)),
        vulnerability_score: Number(vulnerability_clamped.toFixed(2)),
        risk_score: risk_score_final,
        risk_level,
        asset_details: asset,
        hazard_details: hazardData
    };
};

module.exports = {
    calculateRiskDetails,
    mockAssetRegistry
};
