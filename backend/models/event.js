const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    eventName: { type: String, required: true },
    location: { type: String },
    date: { type: Date },
    status: { type: String, default: 'Upcoming' }
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);