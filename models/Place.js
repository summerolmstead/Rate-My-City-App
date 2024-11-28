// models/Place.js
const mongoose = require('mongoose');

const PlaceSchema = new mongoose.Schema({
    placeId: { type: String, unique: true },
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
    category: String,  // Add the category field here to store the category (e.g., "restaurant", "hotel")
    favoriteCount: { type: Number, default: 0 }
});

PlaceSchema.methods.incrementFavoriteCount = function () {
    this.favoriteCount += 1;
    return this.save();
};

PlaceSchema.methods.decrementFavoriteCount = function () {
    if (this,favoriteCount > 0) {
        this.favoriteCount -= 1;
    }
    return this.save();
};

PlaceSchema.index({ placeID: 1 });

module.exports = mongoose.model('Place', PlaceSchema);


