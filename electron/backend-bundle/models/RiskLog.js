const mongoose = require('mongoose');

const RiskLogSchema = new mongoose.Schema({
    asset_id: { type: String, required: true },
    hazard_score: Number,
    exposure_score: Number,
    vulnerability_score: Number,
    risk_score: Number,
    risk_level: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'] },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('RiskLog', RiskLogSchema);
