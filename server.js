//hello this is the backend where all the main logic between layers are :D -summer

require('dotenv').config(); //load environment variables
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const fetch = require('node-fetch');  // This works fine with v2.x must install - Summer

//import the already defined models in /models where all db tables defined
const Place = require('./models/Place');  // Already defined in models/Place.js
const User = require('./models/User');    // Already defined in models/User.js

const app = express();
const PORT = process.env.PORT || 3307;

//middleware setup
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

//session and Passport middleware setup to make sure user signed in
app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: true,
    cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' }
}));
app.use(passport.initialize());
app.use(passport.session());

//passport serialize/deserialize user setup basically needed to track if user logged in to comment and rate etc
passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});

//mongoDB connection
mongoose.connect(process.env.MONGODB_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
}).then(() => {
    console.log('MongoDB connected');
}).catch(err => {
    console.error('MongoDB connection error:', err);
});

//middleware for authentication :p
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(401).send('Unauthorized');
}

//redirect pagessss for each page that needs to be called
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
      
      const restaurants = await Place.find({ category: 'catering.restaurant' }).populate('comments'); // You can also populate if comments are stored as references in another model
  
      if (restaurants.length > 0) {
        res.json(restaurants);
      } else {
        res.status(404).json({ message: 'No restaurants found.' });
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      res.status(500).json({ message: 'Error fetching restaurants.' });
    }
  });

  app.get('/hotels', async (req, res) => {
    try {
      //fetch places where category is 'accommodation.hotel'
      const hotels = await Place.find({ category: 'accommodation.hotel' }).populate('comments');  // Populate comments if they are stored as references
      
      if (hotels.length > 0) {
        res.json(hotels);  
      } else {
        res.status(404).json({ message: 'No hotels found.' });  
      }
    } catch (error) {
      console.error('Error fetching hotels:', error);
      res.status(500).json({ message: 'Error fetching hotels.' });  
    }
  });
  
  //route for fetching entertainment places by category
app.get('/entertainment/:category', async (req, res) => {
    try {
      const { category } = req.params;
  
      //categories to check from api : bowling_alley, aquarium, zoo, museum, escape_game, miniature_golf, theme_park, water_park
      const validCategories = [
        'entertainment.bowling_alley', 
        'entertainment.aquarium',
        'entertainment.zoo',
        'entertainment.museum',
        'entertainment.escape_game',
        'entertainment.miniature_golf',
        'entertainment.theme_park',
        'entertainment.water_park'
      ];
  
      if (!validCategories.includes(category)) {
        return res.status(400).json({ message: 'Invalid category' });
      }
  
      //fetch places based on category
      const places = await Place.find({ category }).populate('comments');  // Populate comments if they exist
  
      if (places.length > 0) {
        res.json(places);  //send the places as JSON
      } else {
        res.status(404).json({ message: 'No entertainment places found.' });
      }
    } catch (error) {
      console.error('Error fetching entertainment places:', error);
      res.status(500).json({ message: 'Error fetching entertainment places.' });
    }
  });
  

//route to get healthcare places in Chattanooga (clinics and hospitals)
// Healthcare route
app.get('/healthcare/:category', async (req, res) => {
    try {
        const { category } = req.params;
  
        // Categories to check from the API
        const validCategories = [
            'healthcare.hospital', 
            'healthcare.clinic_or_praxis' 
        ];
  
        // Check if the provided category is valid
        if (!validCategories.includes(category)) {
            return res.status(400).json({ message: 'Invalid category' });
        }
  
        // Fetch places based on category
        const places = await Place.find({ category }).populate('comments');  // Populate comments if they exist
  
        if (places.length > 0) {
            res.json(places);  // Send the places as JSON
        } else {
            res.status(404).json({ message: 'No healthcare places found.' });
        }
    } catch (error) {
        console.error('Error fetching healthcare places:', error);
        res.status(500).json({ message: 'Error fetching healthcare places.' });
    }
});



  

REDACTED_API_KEY  // Your Geoapify API key

//WHEN WE PASS A CATEGORY FROM THE API IN THIS only call it once!!!!!!!!! if do other cities mak sure to change
async function fetchAndStorePlacesForCategory(category) {
    try {
        console.log(`Fetching places for category: ${category}`); //log the start of fetching
        
        // ( Chattanooga, TN) if use this for other cities CHANGE THIS TO THEIR LOCATION IN THE AP
        const lat = 35.0456;
        const lon = -85.3097;

        //aPI request URL for Geoapify Places API with a specific category like 'catering.restaurant.pizza'
        const apiUrl = `https://api.geoapify.com/v2/places?categories=${category}&lat=${lat}&lon=${lon}&apiKey=${API_KEY}`;
        console.log(`Requesting API URL: ${apiUrl}`); //logging

        //fetch the data from the Geoapify API
        const response = await fetch(apiUrl);
        const data = await response.json();

        //debugging the raw API response
        console.log('Raw API Response:', data); //log the raw response from Geoapify

        //check if we got valid data
        if (!data || !data.features || data.features.length === 0) {
            console.log(`No places found for category: ${category}`);
            return;
        }

        //loop through the fetched places and save them to MongoDB
        for (let placeData of data.features) {
            const place = placeData.properties;

            //log each place being processed
            console.log(`Processing place: ${place.name || 'Unnamed Place'}, ID: ${place.place_id}`);

            //check if the place already exists in the database
            const existingPlace = await Place.findOne({ placeId: place.place_id });

            //log whether the place already exists or needs to be created
            if (existingPlace) {
                console.log(`Place already exists in the database: ${place.name}`);
            } else {
                console.log(`Creating new place: ${place.name || 'Unnamed Place'}`);

                //if the place doesn't exist, create and save it
                const newPlace = new Place({
                    placeId: place.place_id,
                    name: place.name || "Unknown Name",
                    address: place.address_line1 || "Unknown Address",
                    city: place.city || "Unknown City",
                    phone: place.phone || "Unknown Phone",
                    website: place.website || "Unknown Website",
                    category: category,  //the category to store in db so it doesnt get confused with other in table!!!
                    ratings: [],  //initialize with empty ratings
                    comments: []  //initialize with empty comments
                });

                await newPlace.save();  //save the new place to the database
                console.log(`Created and saved new place: ${place.name}`); //for debugging
            }
        }

        console.log(`Successfully fetched and stored places for category: ${category}`);
    } catch (error) {
        console.error('Error fetching and storing places:', error);
    }
}



// Call this function once to populate your database with restaurant data
//fetchAndStorePlacesForCategory('catering.restaurant');  // Fetch and store restaurants - summer successfully called YESSSSSS
//fetchAndStorePlacesForCategory('accommodation.hotel'); //calling hotels ONCE!! summer: success :D
//the following are fore the entertainment page!
//fetchAndStorePlacesForCategory('entertainment.bowling_alley');
//fetchAndStorePlacesForCategory('entertainment.aquarium');
//fetchAndStorePlacesForCategory('entertainment.zoo');
//fetchAndStorePlacesForCategory('entertainment.museum');
//fetchAndStorePlacesForCategory('entertainment.escape_game');
//fetchAndStorePlacesForCategory('entertainment.miniature_golf');
//fetchAndStorePlacesForCategory('entertainment.theme_park');
//fetchAndStorePlacesForCategory('entertainment.water_park');

//for healthcare html categories:  STATEMENTS ARE SUCCESS FOR HEALTHCARE -summer
//fetchAndStorePlacesForCategory('healthcare.clinic_or_praxis');
//fetchAndStorePlacesForCategory('healthcare.hospital');



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

//login endpoint
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

//function to fetch data from the external API
async function fetchPlaceDataFromAPI(placeId) {
    try {
        const response = await fetch(`https://api.geoapify.com/v2/places/${placeId}?apiKey=${API_KEY}`);
        const data = await response.json();

        if (data && data.features && data.features.length > 0) {
            const placeData = data.features[0].properties;

            // extract relevant data
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

//rating submission route
app.post('/rate', isAuthenticated, async (req, res) => {
    const { placeId, rating, comment } = req.body;
    try {
        const place = await Place.findOne({ placeId });
        if (!place) {
            return res.status(404).send('Place not found');
        }

        //add the rating and comment to the place's ratings array to the end
        place.ratings.push(rating);
        place.comments.push(comment);
        await place.save();

        res.status(200).send('Rating submitted successfully');
    } catch (error) {
        console.error('Error submitting rating:', error);
        res.status(500).send('Error submitting rating');
    }
});


app.post('/rate/:placeId', async (req, res) => {
    const { placeId } = req.params;
    const { rating } = req.body;

    try {
        const place = await Place.findOne({ placeId });

        if (!place) {
            return res.status(404).json({ message: 'Place not found' });
        }

        place.ratings.push({ rating });  // Add the new rating
        await place.save();
        res.status(200).json({ message: 'Rating submitted successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting rating' });
    }
});

app.post('/comment/:placeId', async (req, res) => {
    const { placeId } = req.params;
    const { text } = req.body;

    try {
        const place = await Place.findOne({ placeId });

        if (!place) {
            return res.status(404).json({ message: 'Place not found' });
        }

        place.comments.push({ text });  // Add the new comment to the comments array
        await place.save();
        res.status(200).json({ message: 'Comment submitted successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting comment' });
    }
});



// start the server :D
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

