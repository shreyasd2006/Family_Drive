const mongoose = require('mongoose');

const healthSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  householdId: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true },
  type: { type: String, required: true }, // 'Blood Group', 'Vaccination', 'Prescription'
  value: { type: String }, // For blood group or vaccination name
  date: { type: String }, // For vaccination date
  nextDue: { type: String }, // For vaccination next due
  title: { type: String }, // For prescription
  dosage: { type: String }, // For prescription
  notes: { type: String } // For prescription
});

module.exports = mongoose.model('Health', healthSchema);
