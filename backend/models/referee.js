const mongoose = require('mongoose');

const RefereeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    photoUrl: { type: String, required: false },
    localLicenceUrl: { type: String, required: false },
    internationalLicenceUrl: { type: String, required: false },
    localLicenceNumber: { type: String, default: '' },
    internationalLicenceNumber: { type: String, default: '' },
    gradeCategory: {
        type: String,
        enum: ['Grade I', 'Grade II', 'Grade III'],
        default: 'Grade III'
    },
    province: { type: String, default: 'N/A' },
    district: { type: String, default: 'N/A' },
    postalCode: { type: String, default: 'N/A' },
    addressLine1: { type: String, default: 'N/A' },
    addressLine2: { type: String, default: 'N/A' },
    city: { type: String, default: 'N/A' },
    status: { type: String, default: 'Active' }
}, { timestamps: true });

RefereeSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('Referee', RefereeSchema);
