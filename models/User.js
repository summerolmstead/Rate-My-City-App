// models/User.js
const mongoose = require('mongoose');

// Define the User schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    favorites: { type: [String], default: [] } // array of favorite items from website
});

// Create the User model
const User = mongoose.model('User', userSchema);

// Export the User model correctly
module.exports = User;
