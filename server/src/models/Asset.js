const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  title: { type: String, required: true },
  purchaseDate: { type: String },
  warrantyExpiry: { type: String },
  serviceInterval: { type: Number, default: 0 }, // in days
  serviceHistory: [{
    date: { type: String },
    note: { type: String }
  }],
  userId: { type: String, required: true },
  householdId: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true }
});

module.exports = mongoose.model('Asset', assetSchema);
