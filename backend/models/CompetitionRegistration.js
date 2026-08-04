const mongoose = require('mongoose');

const CompetitionRegistrationSchema = new mongoose.Schema({
  competitionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Competition',
    required: true
  },
  athleteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Athlete',
    required: true
  },
  club: { type: String, required: true },
  entryTotal: { type: Number, required: true },
  isReserve: { type: Boolean, default: false } // false for Main, true for Reserve
}, { timestamps: true });

// Prevent duplicate registrations for the same athlete in the same competition
CompetitionRegistrationSchema.index({ competitionId: 1, athleteId: 1 }, { unique: true });

module.exports = mongoose.model('CompetitionRegistration', CompetitionRegistrationSchema);
