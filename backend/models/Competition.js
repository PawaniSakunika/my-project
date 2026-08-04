const mongoose = require('mongoose');

const CompetitionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  date: { type: Date, required: true },
  registrationDeadline: { type: Date, required: true },
  type: { type: String, enum: ['Preliminary', 'Final'], required: true },
  ageCategory: { type: String, enum: ['Youth', 'Junior', 'Senior'], required: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  location: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Competition', CompetitionSchema);
