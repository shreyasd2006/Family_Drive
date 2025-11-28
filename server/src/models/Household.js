const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const householdSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  housePassword: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

householdSchema.pre('save', async function(next) {
  if (!this.isModified('housePassword')) return next();
  this.housePassword = await bcrypt.hash(this.housePassword, 8);
  next();
});

householdSchema.methods.checkPassword = async function(password) {
  return await bcrypt.compare(password, this.housePassword);
};

module.exports = mongoose.model('Household', householdSchema);
