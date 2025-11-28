const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  dueDate: { type: String, required: true },
  status: { type: String, enum: ['paid', 'pending', 'overdue'], default: 'pending' },
  user: { type: String, required: true }, // 'family' or ObjectId string
  householdId: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true }
});

module.exports = mongoose.model('Bill', billSchema);
