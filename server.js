//welcome to the server javascript - this is where the app handles redirects and has the middle and backend defined
require('dotenv').config(); //load environment variables - summer put connection string to database

//import required packages
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
//initialize express app
const app = express();
const PORT = process.env.PORT || 3307; // using port 3307 bc summer knows it works 
//to fetch user data need middleware security to fetch from frontend to backend!
const session = require('express-session');
const passport = require('passport');

//db tables exported
const Place = require('./models/Place'); 
const User = require('./models/User'); // Import the User model

//middleware
app.use(bodyParser.json()); //parse JSON bodies
app.use(cors()); //enable CORS for all requests
app.use(express.static('public')); //serve static files from 'public' directory

app.use(session({
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: true,
    cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' }
}));


//initialize passport.js to use under 
app.use(passport.initialize());
app.use(passport.session());

//successful authentication using packages to communicate for middleware NEED
passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    console.log('Deserialized user:', user); // Add debug log to check if the user is deserialized properly
    done(null, user);
});

//passport.deserializeUser(async (id, done) => {
 //   const user = await User.findById(id);
  //  done(null, user);
//});



//MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
//if connection works or doesnt connect
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));



//HTML app redirects to diff pages !
//serve the HTML file on the root URL
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/OriginalWebPage.html');
});
//direct to signup page
app.get('/signup', (req, res) => {
    res.sendFile(__dirname + '/public/signup.html');
});
//direct to login page
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

//personal user redirect w/ logic to authenticate users
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(401).send('Unauthorized');
}

app.get('/personaluser', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).send('User not found');
        }
        res.json({ 
            firstName: user.firstName, 
            favorites: user.favorites || [] 
        });
    } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send('Error fetching user data');
    }
});
//direct from search box to chattanooga page
app.get('/chattanooga', (req, res) => {
    res.sendFile(__dirname + '/public/chattanooga.html');
});

app.get('/restaurants', async (req, res) => {
    try {
        // Fetch all places from the database
        const places = await Place.find({}).populate('ratings.user');
        // If you are getting data from Geoapify API, make sure the API data includes 'name', 'address', etc.
        // If you use Geoapify, make sure to handle Geoapify API responses properly, here's an example:
        const geoapifyApiKey = '4dee9244ca9041a8a882f81b760bc3ac';
        const geoapifyUrl = `https://api.geoapify.com/v2/places?categories=catering.restaurant&limit=20&apiKey=${geoapifyApiKey}`;
        const geoapifyResponse = await fetch(geoapifyUrl);
        const geoapifyData = await geoapifyResponse.json();

        // If you're using the Geoapify API data to render restaurants, you'll want to use that data for rendering
        // We'll merge the data from the database and API before sending it to the frontend

        res.status(200).json(places); // Or send back merged data (API + DB)
    } catch (err) {
        console.error('Error fetching places:', err);
        res.status(500).json({ error: 'Error fetching places' });
    }
});

  
//API endpoint for user signup
app.post('/signup', async (req, res) => {
    const { username, firstName, lastName, email, password } = req.body;
    //const hashedPassword = await bcrypt.hash(password, 10);

    try {
        //check if the user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).send('User already exists');
        }
        //const newUser = new User({ username, email, password: hashedPassword });
        const newUser = new User({ username, firstName, lastName, email, password });
        await newUser.save(); //save user to the database!
        res.status(201).send('User created successfully');
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).send('Error creating user');
    }
});
//login redirect checks if it works or not
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Log the User model to see if it's available
        console.log('User model:', User); // Debugging line

        const user = await User.findOne({ username });
        if (!user || password !== user.password) {
            return res.status(400).send('Invalid username or password');
        }

        // Set user in session
        req.login(user, (err) => {
            if (err) return res.status(500).send('Login error');
            return res.status(200).send('Login successful');
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Error during login');
    }
});




// Middleware for authentication
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(401).send('Unauthorized');
}


app.get('/places/:category', async (req, res) => {
    const { category } = req.params;
    try {
        const places = await Place.find({ category: category })
            .populate('ratings.user', 'username') // Get the username of the user who rated
            .populate('comments.user', 'username'); // Get the username of the user who commented

        res.json(places);
    } catch (error) {
        console.error('Error fetching places:', error);
        res.status(500).send('Error fetching places');
    }
});


// POST request to submit rating
app.post('/rate/:placeId', async (req, res) => {
    const { placeId } = req.params;
    const { rating } = req.body;
  
    try {
      const place = await Place.findOne({ placeId }).populate('ratings.user');  // Populate user in ratings
  
      if (!place) {
        return res.status(404).json({ error: 'Place not found' });
      }
  
      // Check if user has already rated, and update or add a new rating
      const existingRating = place.ratings.find(r => r.user.toString() === req.user._id.toString());
      if (existingRating) {
        existingRating.rating = rating;  // Update existing rating
      } else {
        place.ratings.push({ user: req.user._id, rating });  // Add new rating
      }
  
      await place.save();
      
      // Send back the updated place with ratings
      const updatedPlace = await Place.findOne({ placeId }).populate('ratings.user');
      res.status(200).json(updatedPlace);  // Return the updated place document
    } catch (err) {
      console.error('Error posting rating:', err);
      res.status(500).json({ error: 'Error posting rating' });
    }
  });
  
  

// API endpoint for submitting a comment -summer
app.post('/comment/:placeId', async (req, res) => {
    const { placeId } = req.params;  // Extract placeId from the URL
    const { comment } = req.body;    // Get comment text from the request body

    // Assuming the user is authenticated and we have the userId
    const userId = req.user._id;

    // Validate inputs
    if (!placeId || !comment || !userId) {
        return res.status(400).json({ error: 'Place ID, comment, and user ID are required' });
    }

    try {
        // Check if place already exists in the database by placeId
        let place = await Place.findOne({ placeId });

        if (!place) {
            console.log(`Place with placeId ${placeId} not found, creating a new place.`);
            
            // Fetch place details from Geoapify API (optional)
            const geoapifyApiKey = '4dee9244ca9041a8a882f81b760bc3ac';
            const geoapifyUrl = `https://api.geoapify.com/v2/places/${placeId}?apiKey=${geoapifyApiKey}`;
            
            const response = await fetch(geoapifyUrl);
            const data = await response.json();

            if (!data.features || data.features.length === 0) {
                return res.status(404).json({ error: 'Place not found in Geoapify' });
            }

            // Extract place details from Geoapify API response with safe checks
            const placeData = data.features[0]?.properties || {};

            const name = placeData.name || 'Unknown Place';
            const address = placeData.address_line1 || 'Unknown Address';
            const category = placeData.categories?.[0] || 'Unknown Category';

            // Create a new place document if it doesn't exist
            place = new Place({
                placeId,                          // Use Geoapify's placeId
                name,                             // Get name from Geoapify
                address,                          // Get address from Geoapify
                category,                         // Get category from Geoapify
                ratings: [],
                comments: []
            });

            // Save the new place to the database
            await place.save();
            console.log(`New place created with placeId ${placeId}`);
        }

        // Add the new comment to the place's comments array
        place.comments.push({
            user: userId,            // Store the user's ID
            text: comment,           // Store the comment text
            createdAt: new Date()    // Automatically set the creation date
        });

        // Save the updated place with the new comment
        await place.save();

        res.status(200).json({ message: 'Comment posted successfully!' });
    } catch (error) {
        console.error('Error posting comment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});




//can delete ltr debugging
app.get('/test', async (req, res) => {
    try {
        const user = await User.findOne({ username: 'testuser' });
        res.json(user); // Should return user data if found
    } catch (error) {
        res.status(500).send('Error accessing database');
    }
});


//start the server!
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

