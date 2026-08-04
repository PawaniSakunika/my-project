const mongoose = require('mongoose');

const OfficialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true }
});

const OptionalOfficialSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String },
  phone: { type: String },
  address: { type: String }
});

const ClubSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  sinceYear: { type: String, required: true },
  address: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  
  president: { type: OfficialSchema, required: true },
  secretary: { type: OfficialSchema, required: true },
  treasurer: { type: OfficialSchema, required: true },
  
  vicePresident: { type: OptionalOfficialSchema },
  assistantSecretary: { type: OptionalOfficialSchema },
  assistantTreasurer: { type: OptionalOfficialSchema },

  isApproved: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Club', ClubSchema);
