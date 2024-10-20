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

//middleware
app.use(bodyParser.json()); //parse JSON bodies
app.use(cors()); //enable CORS for all requests
app.use(express.static('public')); //serve static files from 'public' directory

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
//personalized user home page after login 
app.get('/personaluser', (req, res) => {
    res.sendFile(__dirname + '/public/personaluser.html');
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
    password: { type: String, required: true }, // Remember to hash passwords in production!
});

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
        if (!user) {
            return res.status(400).send('Invalid username or password');
        }

        //directly compare the provided password with the stored password
        if (password !== user.password) {
            return res.status(400).send('Invalid username or password');
        }

        res.status(200).send('Login successful');
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Error during login');
    }
});

//start the server!
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

