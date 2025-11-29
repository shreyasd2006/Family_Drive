const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    householdId: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true },
    inviterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'used', 'expired'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true }
});

module.exports = mongoose.model('Invitation', invitationSchema);
