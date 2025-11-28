const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  number: { type: String, required: true },
  householdId: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true }
});

module.exports = mongoose.model('EmergencyContact', emergencyContactSchema);
