var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser')
var User = require('../models/user');
var passport = require('passport');
var authenticate = require('../authenticate')
var cors = require('./cors');

router.use(bodyParser.json());

/* GET users listing. */
router.get('/', cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, function(req, res, next) {  
  User.find()
  .then((users) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json({ success:true, users: users})
  }, (err) => next(err))
  .catch((err) => next(err))
});

router.post('/signup', cors.corsWithOptions, (req, res, next) => {
  User.register(new User({ username: req.body.username, email: req.body.email }), req.body.password)
    .then(user => {
      // Additional fields
      if (req.body.firstname) {
        user.firstname = req.body.firstname;
      }
      if (req.body.lastname) {
        user.lastname = req.body.lastname;
      }
      return user.save();
    })
    .then(user => {
      passport.authenticate('local')(req, res, () => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({ success: true, status: 'Registration Successful!' });
      });
    })
    .catch(err => {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({ err: err });
    });
});


router.post('/login', cors.corsWithOptions, passport.authenticate('local',{session:false}), (req,res) => { // In the previous code we were providing the username and password in the auth part, here we will include it in the body itself
  var token = authenticate.getToken({_id:req.user._id}); // This token will be used in header to do further activities like adding dishes
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.json({ success:true, token: token, status: 'You are Successfuly logged in!'})
});

router.get('/logout', cors.corsWithOptions, (req,res, next) => {
  if (req.session) {
    req.session.destroy(); //remove the session information in the server side.
    res.clearCookie('session-id'); // this is used to clear the cookie in the client side.
    res.redirect('/');
  }
  else {
    var err = new Error('You are not logged in!');
    err.status = 403;
    return next(err);
  }
})
router.get('/facebook/token', passport.authenticate('facebook-token', {session: false}),
(req, res) => {
  if(req.user) {
    var token = authenticate.getToken({_id: req.user._id});
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json({ success:true, token: token, status: 'You are Successfuly logged in!'})
  }
})
module.exports = router;