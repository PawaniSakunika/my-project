const mongoose = require('mongoose');

const AthleteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  weightClass: { type: String, required: true },
  weightHistory: [
    {
      year: { type: Number, required: true },
      weightClass: { type: String, required: true }
    }
  ],
  photoUrl: { type: String, required: false },
  passportUrl: { type: String, required: false },
  bestSnatch: { type: Number, required: true, default: 0 },
  bestCleanAndJerk: { type: Number, required: true, default: 0 },
  bestTotal: { type: Number, required: true, default: 0 },
  selectedCoach: { type: String, required: true },
  awards: { type: String, default: '' },
  
  province: { type: String, default: 'N/A' },
  district: { type: String, default: 'N/A' },
  postalCode: { type: String, default: 'N/A' },
  
  addressLine1: { type: String, default: 'N/A' },
  addressLine2: { type: String, default: 'N/A' },
  city: { type: String, default: 'N/A' }
}, { timestamps: true }); 

AthleteSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('Athlete', AthleteSchema);
