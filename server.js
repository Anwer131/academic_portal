const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
var usersRouter = require("./routes/users");
var coursesRouter = require("./routes/courses");
var booksRouter = require("./routes/books");

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// app.use(express.json());
app.use(passport.initialize());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(err));

// Passport configuration
require('./authenticate');

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to the chemacademy website backend!');
});

app.use('/users',usersRouter);
app.use('/courses',coursesRouter);
app.use('/books',booksRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});