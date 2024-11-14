const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
    name: String,            // Restaurant or place name
    address: String,         // Street address
    city: String,            // City name
    phone: String,           // Phone number
    website: String,         // Website URL
    placeId: String,         // Unique place identifier (e.g., from Geoapify)
    ratings: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: Number,
    }],
    comments: [{
        text: String,
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
});

const Place = mongoose.model('Place', placeSchema);
module.exports = Place;
