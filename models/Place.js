// models/Place.js
const mongoose = require('mongoose');

const PlaceSchema = new mongoose.Schema({
    placeId: String,
    name: String,
    address: String,
    city: String,
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
    category: String  // Add the category field here to store the category (e.g., "restaurant", "hotel")
});

module.exports = mongoose.model('Place', PlaceSchema);


