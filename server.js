// server.js
require('dotenv').config(); // Load environment variables

// Import required packages
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');

// Import the already defined models
const Place = require('./models/Place');  // Already defined in models/Place.js
const User = require('./models/User');    // Already defined in models/User.js

// Initialize the Express app
const app = express();
const PORT = process.env.PORT || 3307;

// Middleware setup
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

// Session and Passport middleware setup
app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: true,
    cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' }
}));
app.use(passport.initialize());
app.use(passport.session());

// Passport serialize/deserialize user setup
passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
}).then(() => {
    console.log('MongoDB connected');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

// Middleware for authentication check
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(401).send('Unauthorized');
}

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/OriginalWebPage.html');
});

app.get('/signup', (req, res) => {
    res.sendFile(__dirname + '/public/signup.html');
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

app.get('/chattanooga', (req, res) => {
    res.sendFile(__dirname + '/public/chattanooga.html');
});

app.get('/restaurants', async (req, res) => {
    try {
        const places = await Place.find({}).populate('ratings.user');  // Populate ratings with user details
        res.status(200).json(places); // Send the places with ratings (even if empty)
    } catch (err) {
        console.error('Error fetching places:', err);
        res.status(500).json({ error: 'Error fetching places' });
    }
});

// API endpoint for user signup
app.post('/signup', async (req, res) => {
    const { username, firstName, lastName, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).send('User already exists');
        }
        const newUser = new User({ username, firstName, lastName, email, password });
        await newUser.save(); // Save user to the database
        res.status(201).send('User created successfully');
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).send('Error creating user');
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user || password !== user.password) {
            return res.status(400).send('Invalid username or password');
        }
        req.login(user, (err) => {
            if (err) return res.status(500).send('Login error');
            return res.status(200).send('Login successful');
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Error during login');
    }
});

// Rating submission route (Check if user has already rated and update or create a new rating)
// Assuming you are using fetch to interact with the Geoapify API or another API
const fetch = require('node-fetch');

// Your API Key for Geoapify or other external API
const API_KEY = '4dee9244ca9041a8a882f81b760bc3ac';

// Function to fetch data from the external API
async function fetchPlaceDataFromAPI(placeId) {
    try {
        const response = await fetch(`https://api.geoapify.com/v2/places/${placeId}?apiKey=${API_KEY}`);
        const data = await response.json();

        if (data && data.features && data.features.length > 0) {
            const placeData = data.features[0].properties;

            // Extract relevant data
            const name = placeData.name || "Unknown Name";
            const address = placeData.address_line1 || "Unknown Address";
            const city = placeData.city || "Unknown City";
            const phone = placeData.phone || "Unknown Phone";
            const website = placeData.website || "Unknown Website";

            return {
                name,
                address,
                city,
                phone,
                website
            };
        } else {
            throw new Error("Place data not found in API response");
        }
    } catch (error) {
        console.error("Error fetching place data from API:", error);
        return {
            name: "Unknown Place",
            address: "Unknown Address",
            city: "Unknown City",
            phone: "Unknown Phone",
            website: "Unknown Website"
        };
    }
}

// Rating submission route (with real data fetched from API)
app.post('/rate/:placeId', isAuthenticated, async (req, res) => {
    const { placeId } = req.params;
    const { rating } = req.body;
    const user = req.user;  // The authenticated user

    try {
        // Check if the place already exists in the database
        let place = await Place.findOne({ placeId });

        if (!place) {
            // If the place does not exist, fetch real data from the API
            const placeData = await fetchPlaceDataFromAPI(placeId);

            // Create a new place document with the fetched data
            place = new Place({
                placeId,
                name: placeData.name,
                address: placeData.address,
                city: placeData.city,
                phone: placeData.phone,
                website: placeData.website,
                ratings: [],  // Initialize as empty array for ratings
                comments: []  // Initialize as empty array for comments
            });

            await place.save();
            console.log(`Created new place with ID: ${placeId} and fetched data.`);
        }

        // Check if the user has already rated this place
        const existingRating = place.ratings.find(r => r.user.toString() === user._id.toString());

        if (existingRating) {
            // If user has rated, update their rating
            existingRating.rating = rating;
            await place.save();
            return res.status(200).send('Rating updated');
        } else {
            // If the user has not rated this place yet, create a new rating
            place.ratings.push({ user: user._id, rating });
            await place.save();
            return res.status(201).send('Rating added');
        }
    } catch (error) {
        console.error('Error submitting rating:', error);
        return res.status(500).send('Error submitting rating');
    }
});


// Comment submission route
app.post('/comment/:placeId', isAuthenticated, async (req, res) => {
    const { placeId } = req.params;
    const { text } = req.body;
    const user = req.user;  // The authenticated user

    try {
        // Check if the place already exists in the database
        let place = await Place.findOne({ placeId });

        if (!place) {
            // If the place does not exist, create it with initialized fields
            place = new Place({
                placeId,
                name: "Unknown Place",  // Placeholder name
                address: "Unknown Address",  // Placeholder address
                city: "Unknown City",  // Placeholder city
                phone: "Unknown Phone",  // Placeholder phone
                website: "Unknown Website",  // Placeholder website
                ratings: [],  // Initialize as empty array for ratings
                comments: []  // Initialize as empty array for comments
            });
            await place.save();
            console.log(`Created new place with ID: ${placeId}`);
        }

        // Add the comment to the place
        place.comments.push({ text, user: user._id });
        await place.save();

        return res.status(201).send('Comment added');
    } catch (error) {
        console.error('Error adding comment:', error);
        return res.status(500).send('Error adding comment');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

