// models/User.js
const mongoose = require('mongoose');

// Define the User schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Place' }] // array of favorite items from website
});

userSchema.pre('save', function (next) {
    this.favorites = [...new Set(this.favorites)];
    next();
});

userSchema.methods.addFavorite = function (placeId) {
    if (!this.favorites.includes(placeId)) {
        this.favorites.push(placeId);
    }
    return this.save();
};
userSchema.methods.remove = function (placeId) {
    this.favorites = this.favorites.filter((id) => id.toString() !== placeId.toString());
    return this.save();
};

userSchema.method.isFavorited = function (placeId) {
    return this.favorites.includes(placeId.toString());
};

userSchema.statics.findWithFavorites = function (UserID) {
    return this.findById(userId).populate('favorites');
};

// Create the User model
const User = mongoose.model('User', userSchema);

// Export the User model correctly
module.exports = User;
