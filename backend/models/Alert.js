const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
    asset_id: { type: String, required: true },
    risk_score: Number,
    risk_level: String,
    alert_status: { type: String, enum: ['CREATED', 'FAILED'] },
    alert_timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Alert', AlertSchema);
