const mongoose = require('mongoose');

const FakePaymentSchema = new mongoose.Schema({
    clerkId: {
        type: String,
        required: true
    },
    planName: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['success', 'failed'],
        default: 'success'
    },
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('FakePayment', FakePaymentSchema);
