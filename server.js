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

//middleware
app.use(bodyParser.json()); //parse JSON bodies
app.use(cors()); //enable CORS for all requests
app.use(express.static('public')); //serve static files from 'public' directory
app.use(session({ //fetching middleware
    secret: 'yourSecretKey',
    resave: false,
    saveUninitialized: true
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
    done(null, user);
});



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


//user schema and model for db
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    favorites: { type: [String], default: [] } //array of favorite items from website
});

//initalize user object to collect user data to store in userSchema
const User = mongoose.model('User', userSchema);

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



//start the server!
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

