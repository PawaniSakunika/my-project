const mongoose = require('mongoose');

const ResultSchema = new mongoose.Schema({
  name: { type: String, required: true },
  competitionDate: { type: Date, required: true },
  location: { type: String, required: true },
  pdfFilePath: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Result', ResultSchema);
