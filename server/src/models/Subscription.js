const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
    nextBillingDate: { type: String, required: true },
    status: { type: String, enum: ['active', 'cancelled'], default: 'active' },
    userId: { type: String, required: true },
    householdId: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true }
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
