const mongoose = require('mongoose');

const NewsSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  content:     { type: String, required: true },
  category:    { type: String, enum: ['General', 'Competition', 'Training', 'Achievement', 'Announcement'], default: 'General' },
  imageUrl:    { type: String, default: '' },
  isPublished: { type: Boolean, default: true },
  author:      { type: String, default: 'SLWF Admin' },
  postedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('News', NewsSchema);
