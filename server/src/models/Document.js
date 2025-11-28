const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, required: true },
  tags: [{ type: String }],
  userId: { type: String, required: true }, // 'family' or ObjectId string
  householdId: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true },
  expiry: { type: Date },
  location: { type: String },
  secure: { type: Boolean, default: false },
  number: { type: String }, // For secure documents
  fileUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Document', documentSchema);
