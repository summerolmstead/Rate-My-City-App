//hello this is the backend where all the main logic between layers are :D -summer

require('dotenv').config(); //load environment variables
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const fetch = require('node-fetch');  // This works fine with v2.x must install - Summer
const bcrypt = require('bcrypt');

//import the already defined models in /models where all db tables defined
const Place = require('./models/Place');  // Already defined in models/Place.js
const User = require('./models/User');    // Already defined in models/User.js
const MemphisPlace = require('./models/MemphisPlace');
const KnoxvillePlace = require('./models/KnoxvillePlace');
const NashvillePlace = require('./models/NashvillePlace');


const app = express();
const PORT = process.env.PORT || 3307;
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

module.exports = User;

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

//redirect to city of memphis!!! testing - summer
app.get('/memphis', (req, res) => {
    res.sendFile(__dirname + '/public/memphis.html');
});

//redirect to city of knoxville
app.get('/knoxville', (req, res) => {
    res.sendFile(__dirname + '/public/knoxville.html');
});

//redirect to nashville
app.get('/nashville', (req, res) => {
    res.sendFile(__dirname + '/public/nashville.html');
});


// Chattanooga Restaurants
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

  // Memphis restaurants 
  app.get('/memphisrestaurants', async (req, res) => {
    try {
        // Use the correct model name (MemphisPlace, not MemphisPlacePlace)
        const restaurants = await MemphisPlace.find({ category: 'catering.restaurant' }).populate('comments'); // Populating comments if necessary

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

 // Knoxville restaurants 
 app.get('/knoxvillerestaurants', async (req, res) => {
    try {
        // Use the correct model name (MemphisPlace, not MemphisPlacePlace)
        const restaurants = await KnoxvillePlace.find({ category: 'catering.restaurant' }).populate('comments'); // Populating comments if necessary

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

// Nashville restaurants 
app.get('/nashvillerestaurants', async (req, res) => {
    try {
        // Use the correct model name (MemphisPlace, not MemphisPlacePlace)
        const restaurants = await NashvillePlace.find({ category: 'catering.restaurant' }).populate('comments'); // Populating comments if necessary

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



// Chattanooga hotels
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
  
  
// Memphis hotels
app.get('/memphishotels', async (req, res) => {
    try {
      //fetch places where category is 'accommodation.hotel'
      const hotels = await MemphisPlace.find({ category: 'accommodation.hotel' }).populate('comments');  // Populate comments if they are stored as references
      
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

  // Knoxville hotels
app.get('/knoxvillehotels', async (req, res) => {
    try {
      //fetch places where category is 'accommodation.hotel'
      const hotels = await KnoxvillePlace.find({ category: 'accommodation.hotel' }).populate('comments');  // Populate comments if they are stored as references
      
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

  // Nashville hotels
  app.get('/nashvillehotels', async (req, res) => {
    try {
      //fetch places where category is 'accommodation.hotel'
      const hotels = await NashvillePlace.find({ category: 'accommodation.hotel' }).populate('comments');  // Populate comments if they are stored as references
      
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
  
  


//Chattanooga Entertaiment
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
      const places = await Place.find({ category }).populate('comments');  // Populate comments if they existconst places = await Place.find({ category }).populate('comments');  // Populate comments if they exist
  
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

  //Memphis Entertaiment
app.get('/memphisentertainment/:category', async (req, res) => {
    try {
      const { category } = req.params;
  
      //categories to check from api : bowling_alley, aquarium, zoo, museum, escape_game, miniature_golf, theme_park, water_park
      const validCategories = [
        'memphisentertainment.bowling_alley', 
        'memphisentertainment.aquarium',
        'memphisentertainment.zoo',
        'memphisentertainment.museum',
        'memphisentertainment.escape_game',
        'memphisentertainment.miniature_golf',
        'memphisentertainment.theme_park',
        'memphisentertainment.water_park'
      ];
  
      if (!validCategories.includes(category)) {
        return res.status(400).json({ message: 'Invalid category' });
      }
  
      //fetch places based on category
      const places = await MemphisPlace.find({ category }).populate('comments');  // Populate comments if they existconst places = await Place.find({ category }).populate('comments');  // Populate comments if they exist
  
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


//Knoxville Entertaiment
app.get('/knoxvilleentertainment/:category', async (req, res) => {
    try {
      const { category } = req.params;
  
      //categories to check from api : bowling_alley, aquarium, zoo, museum, escape_game, miniature_golf, theme_park, water_park
      const validCategories = [
        'knoxvilleentertainment.bowling_alley', 
        'knoxvilleentertainment.aquarium',
        'knoxvilleentertainment.zoo',
        'knoxvilleentertainment.museum',
        'knoxvilleentertainment.escape_game',
        'knoxvilleentertainment.miniature_golf',
        'knoxvilleentertainment.theme_park',
        'knoxvilleentertainment.water_park'
      ];
  
      if (!validCategories.includes(category)) {
        return res.status(400).json({ message: 'Invalid category' });
      }
  
      //fetch places based on category
      const places = await KnoxvillePlace.find({ category }).populate('comments');  // Populate comments if they existconst places = await Place.find({ category }).populate('comments');  // Populate comments if they exist
  
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

//Nashville Entertaiment
app.get('/nashvilleentertainment/:category', async (req, res) => {
    try {
      const { category } = req.params;
  
      //categories to check from api : bowling_alley, aquarium, zoo, museum, escape_game, miniature_golf, theme_park, water_park
      const validCategories = [
        'nashvilleentertainment.bowling_alley', 
        'nashvilleentertainment.aquarium',
        'nashvilleentertainment.zoo',
        'nashvilleentertainment.museum',
        'nashvilleentertainment.escape_game',
        'nashvilleentertainment.miniature_golf',
        'nashvilleentertainment.theme_park',
        'nashvilleentertainment.water_park'
      ];
  
      if (!validCategories.includes(category)) {
        return res.status(400).json({ message: 'Invalid category' });
      }
  
      //fetch places based on category
      const places = await NashvillePlace.find({ category }).populate('comments');  // Populate comments if they existconst places = await Place.find({ category }).populate('comments');  // Populate comments if they exist
  
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
  

// Healthcare route - Chattanooga
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

//healthcare in memphis
app.get('/memphishealthcare/:category', async (req, res) => {
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

// Healthcare route - Knoxville
app.get('/knoxvillehealthcare/:category', async (req, res) => {
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
        const places = await KnoxvillePlace.find({ category }).populate('comments');  // Populate comments if they exist
  
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


// Healthcare route - Nashville
app.get('/nashvillehealthcare/:category', async (req, res) => {
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
        const places = await NashvillePlace.find({ category }).populate('comments');  // Populate comments if they exist
  
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

//assumed for chattanooga still
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

//summer making test new fetchandstore function specifically for memphis by changing table and longitutde and latitude
//WHEN WE PASS A CATEGORY FROM THE API IN THIS only call it once!!!!!!!!! if do other cities mak sure to change
// Function to fetch and store places for a specific category (e.g., Memphis restaurants, etc.)
// This version is tailored to the Memphis city and uses the MemphisPlace schema
async function fetchAndStorePlacesForCategoryMemphis(category) {
    try {
        console.log(`Fetching places for category: ${category}`); // log the start of fetching
        
        // Memphis latitude and longitude
        const lat = 35.1454;  // Latitude for Memphis
        const lon = -90.0521; // Longitude for Memphis - GET THIS FROM THE API !!!! when in playground 

        // Construct API request URL for Geoapify Places API with specific category like 'catering.restaurant.pizza'
        const apiUrl = `https://api.geoapify.com/v2/places?categories=${category}&lat=${lat}&lon=${lon}&apiKey=${API_KEY}`;
        console.log(`Requesting API URL: ${apiUrl}`); // log the URL being requested

        // Fetch the data from the Geoapify API
        const response = await fetch(apiUrl);
        const data = await response.json();

        // Log raw API response for debugging
        console.log('Raw API Response:', data);

        // Check if valid data is returned
        if (!data || !data.features || data.features.length === 0) {
            console.log(`No places found for category: ${category}`);
            return;
        }

        // Loop through the fetched places and save them to MongoDB
        for (let placeData of data.features) {
            const place = placeData.properties;

            // Log each place being processed
            console.log(`Processing place: ${place.name || 'Unnamed Place'}, ID: ${place.place_id}`);

            // Check if the place already exists in the database by placeId
            const existingPlace = await MemphisPlace.findOne({ placeId: place.place_id });

            // Log if the place already exists or needs to be created
            if (existingPlace) {
                console.log(`Place already exists in the database: ${place.name}`);
            } else {
                console.log(`Creating new place: ${place.name || 'Unnamed Place'}`);

                // If the place doesn't exist, create a new place document and save it
                const newPlace = new MemphisPlace({
                    placeId: place.place_id,
                    name: place.name || "Unknown Name",
                    address: place.address_line1 || "Unknown Address",
                    city: 'Memphis',  // Set city to 'Memphis' explicitly
                    phone: place.phone || "Unknown Phone",
                    website: place.website || "Unknown Website",
                    category: category,  // Store the category for clarity (e.g., restaurant, hotel, etc.)
                    ratings: [],  // Initialize with empty ratings array
                    comments: []  // Initialize with empty comments array
                });

                // Save the new place to the database
                await newPlace.save();
                console.log(`Created and saved new place: ${place.name}`);  // For debugging
            }
        }

        console.log(`Successfully fetched and stored places for category: ${category}`);
    } catch (error) {
        console.error('Error fetching and storing places:', error);
    }
}


// for knoxville - Nandni
async function fetchAndStorePlacesForCategoryKnoxville(category) {
    try {
        console.log(`Fetching places for category: ${category}`); // log the start of fetching
        
        // Knoxville latitude and longitude
        const lat =  35.9993666;  // Latitude for Knoxville
        const lon = -83.77390810730519 // Longitude for Knoxville

        // Construct API request URL for Geoapify Places API with specific category
        const apiUrl = `https://api.geoapify.com/v2/places?categories=${category}&lat=${lat}&lon=${lon}&apiKey=${API_KEY}`;
        console.log(`Requesting API URL: ${apiUrl}`); // log the URL being requested

        // Fetch the data from the Geoapify API
        const response = await fetch(apiUrl);
        const data = await response.json();

        // Log raw API response for debugging
        console.log('Raw API Response:', data);

        // Check if valid data is returned
        if (!data || !data.features || data.features.length === 0) {
            console.log(`No places found for category: ${category}`);
            return;
        }

        // Loop through the fetched places and save them to MongoDB
        for (let placeData of data.features) {
            const place = placeData.properties;

            // Log each place being processed
            console.log(`Processing place: ${place.name || 'Unnamed Place'}, ID: ${place.place_id}`);

            // Check if the place already exists in the database by placeId
            const existingPlace = await KnoxvillePlace.findOne({ placeId: place.place_id });

            // Log if the place already exists or needs to be created
            if (existingPlace) {
                console.log(`Place already exists in the database: ${place.name}`);
            } else {
                console.log(`Creating new place: ${place.name || 'Unnamed Place'}`);

                // If the place doesn't exist, create a new place document and save it
                const newPlace = new KnoxvillePlace({
                    placeId: place.place_id,
                    name: place.name || "Unknown Name",
                    address: place.address_line1 || "Unknown Address",
                    city: 'Knoxville',  // Set city to 'Knoxville' explicitly
                    phone: place.phone || "Unknown Phone",
                    website: place.website || "Unknown Website",
                    category: category,  // Store the category for clarity (e.g., restaurant, hotel, etc.)
                    ratings: [],  // Initialize with empty ratings array
                    comments: []  // Initialize with empty comments array
                });

                // Save the new place to the database
                await newPlace.save();
                console.log(`Created and saved new place: ${place.name}`);  // For debugging
            }
        }

        console.log(`Successfully fetched and stored places for category: ${category}`);
    } catch (error) {
        console.error('Error fetching and storing places:', error);
    }
}

// for Nashville
async function fetchAndStorePlacesForCategoryNashville(category) {
    try {
        console.log(`Fetching places for category: ${category}`); //log the start of fetching
        
        // ( Nashville, TN) if use this for other cities CHANGE THIS TO THEIR LOCATION IN THE AP
        const lat = 36.143358699750074;
        const lon = -86.66267662270768;

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
            const existingPlace = await NashvillePlace.findOne({ placeId: place.place_id });

            //log whether the place already exists or needs to be created
            if (existingPlace) {
                console.log(`Place already exists in the database: ${place.name}`);
            } else {
                console.log(`Creating new place: ${place.name || 'Unnamed Place'}`);

                //if the place doesn't exist, create and save it
                const newPlace = new NashvillePlace({
                    placeId: place.place_id,
                    name: place.name || "Unknown Name",
                    address: place.address_line1 || "Unknown Address",
                    city: "Nashville" || "Unknown City",
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

//CHATTANOOGA//
// Call this function once to populate your database with restaurant data
//fetchAndStorePlacesForCategory('catering.restaurant');  // Fetch and store restaurants - summer successfully called YESSSSSS
//fetchAndStorePlacesForCategory('accommodation.hotel'); //calling hotels ONCE!! summer: success :D
//fetchAndStorePlacesForCategory('entertainment.bowling_alley');
//fetchAndStorePlacesForCategory('entertainment.aquarium');
//fetchAndStorePlacesForCategory('entertainment.zoo');
//fetchAndStorePlacesForCategory('entertainment.museum');
//fetchAndStorePlacesForCategory('entertainment.escape_game');
//fetchAndStorePlacesForCategory('entertainment.miniature_golf');
//fetchAndStorePlacesForCategory('entertainment.theme_park');
//fetchAndStorePlacesForCategory('entertainment.water_park');
//fetchAndStorePlacesForCategory('healthcare.clinic_or_praxis');
//fetchAndStorePlacesForCategory('healthcare.hospital');

//MEMPHIS// - DO NOT GO AGAIN!!! - already at 206 places. NANDNI ALREADY COMPLETED.
//testing memphis restaurants summer !!!!! only run once remember ->
//fetchAndStorePlacesForCategoryMemphis('catering.restaurant'); SUCCESS DO NOT CALL AGAIN LOL
//fetchAndStorePlacesForCategoryMemphis('accommodation.hotel'); // Run this to populate Memphis hotels - Nandni 
//fetchAndStorePlacesForCategoryMemphis('entertainment.bowling_alley');
//fetchAndStorePlacesForCategoryMemphis('entertainment.aquarium');
//fetchAndStorePlacesForCategoryMemphis('entertainment.zoo');
//fetchAndStorePlacesForCategoryMemphis('entertainment.museum');
//fetchAndStorePlacesForCategoryMemphis('entertainment.escape_game');
//fetchAndStorePlacesForCategoryMemphis('entertainment.miniature_golf');
//fetchAndStorePlacesForCategoryMemphis('entertainment.theme_park');
//fetchAndStorePlacesForCategoryMemphis('entertainment.water_park');
//fetchAndStorePlacesForCategoryMemphis('healthcare.clinic_or_praxis');
//fetchAndStorePlacesForCategoryMemphis('healthcare.hospital');


//KNOXVILLE// - DO NOT DO AGAIN!!! - NANDNI ALREADY COMPLETED.
//fetchAndStorePlacesForCategoryKnoxville('accommodation.hotel'); // Run this to populate knoxville hotels - Nandni
//fetchAndStorePlacesForCategoryKnoxville('catering.restaurant');  // Fetch and store knoxville restaurants - nandni
//fetchAndStorePlacesForCategoryKnoxville('healthcare.clinic_or_praxis');
//fetchAndStorePlacesForCategoryKnoxville('healthcare.hospital');
//fetchAndStorePlacesForCategoryKnoxville('entertainment.bowling_alley');
//fetchAndStorePlacesForCategoryKnoxville('entertainment.aquarium');
//fetchAndStorePlacesForCategoryKnoxville('entertainment.zoo');
//fetchAndStorePlacesForCategoryKnoxville('entertainment.museum');
//fetchAndStorePlacesForCategoryKnoxville('entertainment.escape_game');
//fetchAndStorePlacesForCategoryKnoxville('entertainment.miniature_golf');
//fetchAndStorePlacesForCategoryKnoxville('entertainment.theme_park');
//fetchAndStorePlacesForCategoryKnoxville('entertainment.water_park');



//Nashville - this is still left - RUN THIS FROM NODE SERVER>JS in TERMINAL
//fetchAndStorePlacesForCategoryNashville('catering.restaurant');  
//fetchAndStorePlacesForCategoryNashville('accommodation.hotel'); 
//fetchAndStorePlacesForCategoryNashville('entertainment.bowling_alley');
//fetchAndStorePlacesForCategoryNashville('entertainment.aquarium');
//fetchAndStorePlacesForCategoryNashville('entertainment.zoo');
//fetchAndStorePlacesForCategoryNashville('entertainment.museum');
//fetchAndStorePlacesForCategoryNashville('entertainment.escape_game');
//fetchAndStorePlacesForCategoryNashville('entertainment.miniature_golf');
//fetchAndStorePlacesForCategoryNashville('entertainment.theme_park');
//fetchAndStorePlacesForCategoryNashville('entertainment.water_park');
//fetchAndStorePlacesForCategoryNashville('healthcare.clinic_or_praxis');
//fetchAndStorePlacesForCategoryNashville('healthcare.hospital');



app.post('/signup', async (req, res) => {
    const { username, firstName, lastName, email, password } = req.body;

    try {
        // check if the username or email already exists
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });
        if (existingUser) {
            return res.status(400).send('Username or email already in use.');
        }

        // hash the password
        const saltRounds = 10; // Adjust as necessary for your security requirements
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // create and save the new user
        const newUser = new User({
            username,
            firstName,
            lastName,
            email,
            password: hashedPassword // store the hashed password
        });

        await newUser.save(); // save the new user in the database

        res.status(201).send('User created successfully');
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).send('An internal server error occurred. Please try again later.');
    }
});

//login endpoint

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // find user by username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).send('Invalid username or password');
        }

        // compare passwords using bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).send('Invalid username or password');
        }

        //  passwords match, log the user in
        req.login(user, (err) => {
            if (err) {
                console.error('Error during login:', err);
                return res.status(500).send('Login failed');
            }
            res.status(200).send('Login successful');
        });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).send('An error occurred');
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



// Chattanooga-specific rating submission route
app.post('/rate/chattanooga/:placeId', async (req, res) => {
    const { placeId } = req.params;
    const { rating } = req.body;  // Only the rating is being processed

    console.log("Rating submission for Chattanooga placeId:", placeId);

    try {
        // Find the place in the Chattanooga database
        const place = await Place.findOne({ placeId });

        if (!place) {
            return res.status(404).json({ message: 'Place not found' });
        }

        // Add the rating to the ratings array
        place.ratings.push({ rating });

        // Save the place and send back the updated place data
        await place.save();
        res.status(200).json({ message: 'Rating submitted successfully!', place });  // Send the updated place object

    } catch (error) {
        console.error('Error submitting rating:', error);
        res.status(500).json({ message: 'Error submitting rating' });
    }
});

// Memphis-specific rating submission route
app.post('/rate/memphis/:placeId', async (req, res) => {
    const { placeId } = req.params;
    const { rating } = req.body;

    console.log("Rating submission for Memphis placeId:", placeId);  // Log to check

    try {
        // Find the place in the Memphis database
        const place = await MemphisPlace.findOne({ placeId });

        if (!place) {
            return res.status(404).json({ message: 'Place not found' });
        }

        // Add the rating to the ratings array
        place.ratings.push({ rating });

        await place.save();
        res.status(200).json({ message: 'Rating submitted successfully!' });

    } catch (error) {
        console.error('Error submitting rating:', error);
        res.status(500).json({ message: 'Error submitting rating' });
    }
});

// Knoxville-specific rating submission route
app.post('/rate/knoxville/:placeId', async (req, res) => {
    const { placeId } = req.params;
    const { rating } = req.body;

    console.log("Rating submission for Knoxville placeId:", placeId);  // Log to check

    try {
        // Find the place in the knox database
        const place = await KnoxvillePlace.findOne({ placeId });

        if (!place) {
            return res.status(404).json({ message: 'Place not found' });
        }

        // Add the rating to the ratings array
        place.ratings.push({ rating });

        await place.save();
        res.status(200).json({ message: 'Rating submitted successfully!' });

    } catch (error) {
        console.error('Error submitting rating:', error);
        res.status(500).json({ message: 'Error submitting rating' });
    }
});

// Nashville-specific rating submission route
app.post('/rate/nashville/:placeId', async (req, res) => {
    const { placeId } = req.params;
    const { rating } = req.body;

    console.log("Rating submission for Nashville placeId:", placeId);  // Log to check

    try {
        // Find the place in the knox database
        const place = await NashvillePlace.findOne({ placeId });

        if (!place) {
            return res.status(404).json({ message: 'Place not found' });
        }

        // Add the rating to the ratings array
        place.ratings.push({ rating });

        await place.save();
        res.status(200).json({ message: 'Rating submitted successfully!' });

    } catch (error) {
        console.error('Error submitting rating:', error);
        res.status(500).json({ message: 'Error submitting rating' });
    }
});


// Chattanooga comment submission route
app.post('/comment/chattanooga/:placeId', async (req, res) => {
    const { placeId } = req.params;
    const { text } = req.body;

    try {
        const place = await Place.findOne({ placeId });

        if (!place) {
            return res.status(404).json({ message: 'Place not found' });
        }

        place.comments.push({ text });
        await place.save();
        res.status(200).json({ message: 'Comment submitted successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting comment' });
    }
});

// Memphis comment submission route
app.post('/comment/memphis/:placeId', async (req, res) => {
    const { placeId } = req.params;
    const { text } = req.body;

    try {
        const place = await MemphisPlace.findOne({ placeId });

        if (!place) {
            return res.status(404).json({ message: 'Place not found' });
        }

        place.comments.push({ text });
        await place.save();
        res.status(200).json({ message: 'Comment submitted successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting comment' });
    }
});

// Knoxville comment submission route
app.post('/comment/knoxville/:placeId', async (req, res) => {
    const { placeId } = req.params;
    const { text } = req.body;

    try {
        const place = await KnoxvillePlace.findOne({ placeId });

        if (!place) {
            return res.status(404).json({ message: 'Place not found' });
        }

        place.comments.push({ text });
        await place.save();
        res.status(200).json({ message: 'Comment submitted successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting comment' });
    }
});

// Nashville comment submission route
app.post('/comment/nashville/:placeId', async (req, res) => {
    const { placeId } = req.params;
    const { text } = req.body;

    try {
        const place = await NashvillePlace.findOne({ placeId });

        if (!place) {
            return res.status(404).json({ message: 'Place not found' });
        }

        place.comments.push({ text });
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

