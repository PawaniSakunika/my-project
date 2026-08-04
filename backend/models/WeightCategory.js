const mongoose = require('mongoose');

const WeightCategorySchema = new mongoose.Schema({
  category_name: { type: String, required: true },
  year: { type: Number, required: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('WeightCategory', WeightCategorySchema);
