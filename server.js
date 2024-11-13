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


app.post('/rate/:placeId', async (req, res) => {
    try {
        const { placeId } = req.params;  // Assuming placeId is passed as a string
        const { rating } = req.body;

        // Find the place by its string `placeId` (not ObjectId)
        const place = await Place.findOne({ placeId: placeId });

        if (!place) {
            return res.status(404).json({ message: 'Place not found' });
        }

        // Add the rating to the place's ratings array
        place.ratings.push({
            user: req.user._id,  // Assuming `req.user._id` is available (user logged in)
            rating: rating
        });

        await place.save();

        res.status(200).json({ message: 'Rating submitted successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error submitting rating' });
    }
});




// API endpoint for submitting a comment -summer
app.post('/comment/:placeId', isAuthenticated, async (req, res) => {
    const { placeId } = req.params;
    const { text } = req.body;

    if (!text || text.trim() === '') {
        return res.status(400).send('Comment cannot be empty');
    }

    try {
        const place = await Place.findById(placeId);
        if (!place) {
            return res.status(404).send('Place not found');
        }

        // Add the comment
        place.comments.push({
            user: req.user._id,
            text,
            createdAt: new Date()
        });
        await place.save();

        res.status(200).send('Comment posted successfully');
    } catch (error) {
        console.error('Error posting comment:', error);
        res.status(500).send('Error posting comment');
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

// Endpoint to fetch entertainment places (with ratings and comments)
app.get('/places/entertainment', async (req, res) => {
    try {
        const places = await Place.find({ category: 'Entertainment' })  // Filter by category, adjust accordingly
            .populate('ratings.user', 'username')  // Populate the username of users who rated the place
            .populate('comments.user', 'username');  // Populate the username of users who commented

        res.json(places);
    } catch (error) {
        console.error('Error fetching entertainment places:', error);
        res.status(500).send('Error fetching entertainment places');
    }
});



//start the server!
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

