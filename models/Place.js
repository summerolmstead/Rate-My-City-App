const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
    placeId: { type: String, required: true },  // If you are storing Geoapify's place_id as a string
    name: { type: String, required: true },
    address: { type: String, required: true },
    category: { type: String, required: true },  // Add the category field here
    ratings: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // Reference to User
            rating: { type: Number, min: 1, max: 5, required: true }
        }
    ],
    comments: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  // Reference to User
            text: { type: String, required: true },
            createdAt: { type: Date, default: Date.now }
        }
    ]
});

const Place = mongoose.model('Place', placeSchema);
module.exports = Place;


