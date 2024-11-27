// models/User.js
const mongoose = require('mongoose');

// Define the User schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    favorites: [{type: mongoose.Schema.Types.ObjectId, ref: 'Place', default: [] }], // array of favorite items from website
    ceateAt: { type: Date, default: Date.now },
});

// Create the User model
userSchema.methods.addFavorite = async function (placeId) {
    if (!this.favorite.some(favorite => favorite.toString() === placeId.toString())) {
        this.favorites.push(placeId);
        await this.save();
    }
};

userSchema.methods.removeFavorite = async function (placeId) {
    this.favorites = this.favorites.filter((favorite) => favorite.toString() !== placeId.toString());
    await this.save();
};

// Export the User model correctly
module.exports = mongoose.model('User', userSchema);
