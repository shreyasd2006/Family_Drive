const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  number: { type: String, required: true },
  customFields: [{
    label: { type: String, required: true },
    value: { type: String, required: true }
  }],
  userId: { type: String, required: true },
  householdId: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true }
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
