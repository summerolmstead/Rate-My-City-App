const mongoose = require('mongoose');

const MemphisPlaceSchema = new mongoose.Schema({
    placeId: String,
    name: String,
    address: String,
    city: { type: String, default: 'Memphis' },  // Default city set to Memphis
    phone: String,
    website: String,
    ratings: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            rating: Number
        }
    ],
    comments: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            text: String,
            createdAt: { type: Date, default: Date.now }
        }
    ],
    category: String
});

module.exports = mongoose.model('MemphisPlace', MemphisPlaceSchema);
