const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
    name: { type: String, required: true },
    customFields: [{
        label: { type: String, required: true },
        value: { type: String, required: true }
    }],
    userId: { type: String, required: true },
    householdId: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true }
});

module.exports = mongoose.model('Property', propertySchema);
