const mongoose = require('mongoose');

const NashvillePlaceSchema = new mongoose.Schema({
    placeId: String,
    name: String,
    address: String,
    city: { type: String, default: 'Nashville' },  // Default city set to Nashville
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

module.exports = mongoose.model('NashvillePlace', NashvillePlaceSchema);
